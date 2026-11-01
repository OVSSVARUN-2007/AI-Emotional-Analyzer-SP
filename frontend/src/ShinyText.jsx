import './ShinyText.css';

/**
 * ShinyText Component (React Bits)
 *
 * Implements a dynamic shimmering reflection sweep across text.
 */
export default function ShinyText({
  children,
  text,
  disabled = false,
  speed = 4,
  className = '',
  color = 'inherit',
  shineColor = 'rgba(255, 255, 255, 0.95)',
}) {
  const content = text || children;
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        animationDuration,
        '--shiny-color': color,
        '--shiny-highlight': shineColor,
      }}
    >
      {content}
    </span>
  );
}

