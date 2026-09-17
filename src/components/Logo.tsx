interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: { titleSize: 13, subtitleSize: 8, gap: 8 },
    md: { titleSize: 15, subtitleSize: 9, gap: 10 },
    lg: { titleSize: 18, subtitleSize: 10, gap: 12 },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
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
