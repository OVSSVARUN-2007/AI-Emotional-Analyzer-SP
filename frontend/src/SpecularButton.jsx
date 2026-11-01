import { useRef, useEffect, useCallback } from 'react';
import './specular-button.css';

/**
 * SpecularButton Component
 *
 * Implements a hyper-realistic specular highlight button with dynamic chamfer rim
 * reflection, customizable tint sheen, physics-based mouse proximity tracking,
 * and high-performance RAF variable updates.
 */
export default function SpecularButton({
  children,
  size = 'md',
  radius = 18,
  tint = '#ffffff',
  tintOpacity = 0.05,
  textColor = '#ffffff',
  lineColor = '#818cf8',
  baseColor = '#4f46e5',
  intensity = 1,
  idleIntensity = 0.35,
  shineSize = 10,
  shineFade = 34,
  thickness = 1.2,
  glow = 1,
  followMouse = true,
  proximity = 250,
  onClick,
  className = '',
  style = {},
  disabled = false,
  type = 'button',
  ...restProps
}) {
  const buttonRef = useRef(null);

  // Directly update CSS properties on the button node for 60+ FPS performance
  const setSpecularVars = useCallback((x, y, currentIntensity) => {
    const el = buttonRef.current;
    if (!el) return;
    el.style.setProperty('--specular-x', `${x.toFixed(1)}%`);
    el.style.setProperty('--specular-y', `${y.toFixed(1)}%`);
    el.style.setProperty('--specular-intensity', currentIntensity.toFixed(3));
  }, []);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    // Apply material properties to CSS custom properties
    el.style.setProperty('--specular-radius', typeof radius === 'number' ? `${radius}px` : radius);
    el.style.setProperty('--specular-thickness', typeof thickness === 'number' ? `${thickness}px` : thickness);
    el.style.setProperty('--specular-base', baseColor);
    el.style.setProperty('--specular-text', textColor);
    el.style.setProperty('--specular-line', lineColor);
    el.style.setProperty('--specular-tint', tint);
    el.style.setProperty('--specular-tint-opacity', String(tintOpacity));
    el.style.setProperty('--specular-shine-size', `${shineSize}%`);
    el.style.setProperty('--specular-shine-fade', `${shineFade}%`);
    el.style.setProperty('--specular-glow', String(glow));

    if (disabled) {
      setSpecularVars(50, 50, 0);
      return;
    }

    // Set initial idle shine state
    setSpecularVars(50, 15, idleIntensity);

    if (!followMouse) return;

    let rafId = null;

    const onPointerMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const isInside =
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom;

        if (isInside) {
          const x = ((mouseX - rect.left) / rect.width) * 100;
          const y = ((mouseY - rect.top) / rect.height) * 100;
          setSpecularVars(x, y, intensity);
        } else {
          const dx = Math.max(rect.left - mouseX, 0, mouseX - rect.right);
          const dy = Math.max(rect.top - mouseY, 0, mouseY - rect.bottom);
          const dist = Math.hypot(dx, dy);

          if (dist <= proximity) {
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const angle = Math.atan2(mouseY - cy, mouseX - cx);
            const x = 50 + Math.cos(angle) * 45;
            const y = 50 + Math.sin(angle) * 45;
            const factor = 1 - dist / proximity;
            const curr = idleIntensity + (intensity - idleIntensity) * factor;
            setSpecularVars(x, y, curr);
          } else {
            setSpecularVars(50, 15, idleIntensity);
          }
        }
      });
    };

    const onPointerLeave = () => {
      setSpecularVars(50, 15, idleIntensity);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mouseleave', onPointerLeave);
    };
  }, [
    radius,
    thickness,
    baseColor,
    textColor,
    lineColor,
    tint,
    tintOpacity,
    shineSize,
    shineFade,
    glow,
    intensity,
    idleIntensity,
    followMouse,
    proximity,
    disabled,
    setSpecularVars,
  ]);

  const sizeClass = `specular-button--${size}`;

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`specular-button ${sizeClass} ${className}`.trim()}
      style={style}
      {...restProps}
    >
      <span className="specular-tint" aria-hidden="true" />
      <span className="specular-content">{children}</span>
    </button>
  );
}
