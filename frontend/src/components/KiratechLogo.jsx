import { Link } from 'react-router-dom';

/**
 * KIRATECH Logo Component
 * Clicking the logo always navigates home (or to `linkTo` if specified).
 * Props:
 *   size      — pixel size of the icon mark (default 32)
 *   showText  — whether to show "KIRATECH" wordmark beside/below the mark (default true)
 *   layout    — "row" (icon + text side by side) | "col" (icon above text)
 *   className — extra classes on the wrapper
 *   linkTo    — destination path (default "/"); pass false to disable the link
 */
export default function KiratechLogo({
  size = 32,
  showText = true,
  layout = 'row',
  className = '',
  linkTo = '/',
}) {
  const isRow = layout === 'row';

  const inner = (
    <span
      className={`inline-flex ${isRow ? 'items-center gap-2' : 'flex-col items-center gap-1'} ${className}`}
    >
      {/* ── Vortex SVG mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="kg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0d9488" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="1"   />
          </radialGradient>
          <radialGradient id="kg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#134e4a" />
            <stop offset="100%" stopColor="#0f766e" />
          </radialGradient>
        </defs>

        {/* Four curved arms forming the vortex, rotated 0°/90°/180°/270° */}
        {[0, 90, 180, 270].map((rot, i) => (
          <g key={i} transform={`rotate(${rot} 50 50)`}>
            {/* Main arm — wide curved path */}
            <path
              d="M50 50
                 C54 38, 66 28, 62 18
                 C59 10, 50 8, 46 14
                 C42 20, 46 30, 50 50Z"
              fill="url(#kg1)"
              opacity={0.85 - i * 0.08}
            />
            {/* Inner thin detail lines */}
            <path
              d="M50 50
                 C52 42, 58 35, 57 26
                 C56 20, 52 18, 50 21"
              stroke="#2dd4bf"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M50 50
                 C53 43, 61 36, 60 27"
              stroke="#2dd4bf"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />
            {/* Teardrop tip */}
            <ellipse
              cx="53"
              cy="14"
              rx="4.5"
              ry="6"
              transform="rotate(-20 53 14)"
              fill="#2dd4bf"
              opacity="0.95"
            />
          </g>
        ))}

        {/* Dark centre circle */}
        <circle cx="50" cy="50" r="10" fill="url(#kg2)" />
        <circle cx="50" cy="50" r="6"  fill="#042f2e" opacity="0.9" />
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <span
          className="font-bold tracking-widest text-teal-500 dark:text-teal-400 select-none"
          style={{ fontSize: size * 0.44, letterSpacing: '0.12em', lineHeight: 1 }}
        >
          KIRATECH
        </span>
      )}
    </span>
  );

  // Wrap in Link unless linkTo is explicitly false
  if (linkTo === false) return inner;

  return (
    <Link
      to={linkTo}
      className="inline-flex hover:opacity-80 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg"
      aria-label="KIRATECH — Go to home"
    >
      {inner}
    </Link>
  );
}
