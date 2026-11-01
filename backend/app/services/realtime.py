"""Real-time event delivery with an optional Kafka transport.

The application works without Kafka for local development: connected WebSocket
clients still receive events from this process. Set KAFKA_BOOTSTRAP_SERVERS
in a shared deployment to publish events through Kafka.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class RealtimeEvents:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._producer: Any = None
        self._consumer: Any = None
        self._consumer_thread: threading.Thread | None = None
        self._stop_consumer = threading.Event()
        self._topic = os.getenv("KAFKA_TOPIC", "student-feedback-events")
        self._instance_id = os.getenv("REALTIME_INSTANCE_ID", str(uuid4()))

    @property
    def kafka_enabled(self) -> bool:
        return self._producer is not None

    def configure(self, loop: asyncio.AbstractEventLoop) -> None:
        """Connect to Kafka only when explicitly configured."""
        self._loop = loop
        bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
        if not bootstrap_servers:
            return
        try:
            from kafka import KafkaConsumer, KafkaProducer

            self._producer = KafkaProducer(
                bootstrap_servers=bootstrap_servers.split(","),
                value_serializer=lambda value: json.dumps(value).encode("utf-8"),
                request_timeout_ms=3000,
                api_version_auto_timeout_ms=3000,
            )
            self._consumer = KafkaConsumer(
                self._topic,
                bootstrap_servers=bootstrap_servers.split(","),
                value_deserializer=lambda value: json.loads(value.decode("utf-8")),
                group_id=os.getenv("KAFKA_WEBSOCKET_GROUP", f"feedback-websocket-{self._instance_id}"),
                auto_offset_reset="latest",
                consumer_timeout_ms=1000,
            )
            self._consumer_thread = threading.Thread(target=self._consume, daemon=True)
            self._consumer_thread.start()
            logger.info("Kafka real-time publishing enabled for topic %s", self._topic)
        except Exception as exc:
            logger.warning("Kafka unavailable; using local real-time delivery: %s", exc)
            self._producer = None

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    async def _broadcast(self, event: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for client in tuple(self._clients):
            try:
                await client.send_json(event)
            except Exception:
                stale.append(client)
        for client in stale:
            self._clients.discard(client)

    def _deliver(self, event: dict[str, Any]) -> None:
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._broadcast(event), self._loop)

    def _consume(self) -> None:
        """Forward events from other application instances to local sockets."""
        while not self._stop_consumer.is_set() and self._consumer is not None:
            try:
                for message in self._consumer:
                    event = message.value
                    if event.get("origin") != self._instance_id:
                        self._deliver(event)
                    if self._stop_consumer.is_set():
                        break
            except Exception as exc:
                logger.warning("Kafka consumer error: %s", exc)
                self._stop_consumer.wait(2)

    def close(self) -> None:
        self._stop_consumer.set()
        for client in (self._consumer, self._producer):
            if client is not None:
                try:
                    client.close()
                except Exception:
                    pass

    def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        """Publish from synchronous route handlers without blocking requests."""
        event = {
            "id": str(uuid4()),
            "type": event_type,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "origin": self._instance_id,
            "payload": payload,
        }
        if self._producer is not None:
            try:
                self._producer.send(self._topic, event).get(timeout=3)
            except Exception as exc:
                logger.warning("Kafka publish failed; delivering event locally: %s", exc)

        self._deliver(event)


realtime_events = RealtimeEvents()
