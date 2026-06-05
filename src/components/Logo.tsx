interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 32, titleSize: 13, subtitleSize: 8, gap: 8 },
    md: { icon: 40, titleSize: 15, subtitleSize: 9, gap: 10 },
    lg: { icon: 52, titleSize: 18, subtitleSize: 10, gap: 12 },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      {/* Icon mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Red square background */}
        <rect width="100" height="100" rx="10" fill="#DC2626" />

        {/* Umlaut dots (Ñ style) */}
        <circle cx="34" cy="16" r="5.5" fill="#0f1729" />
        <circle cx="66" cy="16" r="5.5" fill="#0f1729" />

        {/* N letter — dark navy */}
        <path
          d="M18 82 L18 30 L50 68 L82 30 L82 82"
          stroke="#0f1729"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Diagonal accent — steel/white, the brand slash */}
        <line
          x1="12"
          y1="88"
          x2="88"
          y2="12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark */}
      <div className="leading-none flex flex-col" style={{ gap: 2 }}>
        <span
          className="text-white font-black tracking-tight leading-none"
          style={{ fontSize: s.titleSize }}
        >
          N3 Thinktech
        </span>
        <span
          className="text-red-500 font-semibold tracking-[0.18em] uppercase leading-none"
          style={{ fontSize: s.subtitleSize }}
        >
          IA Laboratory
        </span>
      </div>
    </div>
  );
}
