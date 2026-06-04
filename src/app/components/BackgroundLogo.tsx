/**
 * BackgroundLogo — filigrane LARODEC SVG réutilisable
 * Usage : <BackgroundLogo dark /> pour fond sombre (login, headers)
 *         <BackgroundLogo /> pour fond clair
 */

interface BackgroundLogoProps {
  dark?: boolean;          // true = fond sombre (stroke blanc)
  size?: number;           // largeur en px (défaut 380)
  opacity?: number;        // opacité (défaut 0.15 clair, 0.07 sombre)
  rotate?: number;         // rotation en degrés (défaut -8)
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  zIndex?: number;
}

export function BackgroundLogo({
  dark = false,
  size = 380,
  opacity,
  rotate = -8,
  top = -30,
  right,
  bottom,
  left,
  zIndex = 0,
}: BackgroundLogoProps) {
  const color  = dark ? "#FFFFFF" : "#93C5FD";
  const finalOpacity = opacity ?? (dark ? 0.07 : 0.15);

  const style: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    opacity: finalOpacity,
    transform: `rotate(${rotate}deg)`,
    zIndex,
    pointerEvents: "none",
    userSelect: "none",
    animation: "logo-breathe 10s ease-in-out infinite",
  };
  if (top    !== undefined) style.top    = top;
  if (right  !== undefined) style.right  = right;
  if (bottom !== undefined) style.bottom = bottom;
  if (left   !== undefined) style.left   = left;

  return (
    <>
      <div aria-hidden="true" style={style}>
        <svg viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}>
          {/* Cercles concentriques radar */}
          <circle cx="200" cy="200" r="160" stroke={color} strokeWidth="3"/>
          <circle cx="200" cy="200" r="120" stroke={color} strokeWidth="2.5"/>
          <circle cx="200" cy="200" r="80"  stroke={color} strokeWidth="2"/>
          <circle cx="200" cy="200" r="40"  stroke={color} strokeWidth="2"/>
          <circle cx="200" cy="200" r="12"  stroke={color} strokeWidth="2"/>
          {/* Flèche */}
          <line x1="215" y1="200" x2="370" y2="200" stroke={color} strokeWidth="4" strokeLinecap="round"/>
          <line x1="340" y1="178" x2="370" y2="200" stroke={color} strokeWidth="4" strokeLinecap="round"/>
          <line x1="340" y1="222" x2="370" y2="200" stroke={color} strokeWidth="4" strokeLinecap="round"/>
          {/* LARODEC en contour */}
          <text x="18" y="400" fontFamily="'Inter','Segoe UI',Arial,sans-serif" fontWeight="900"
            fontSize="56" fill="none" stroke={color} strokeWidth="1.2" letterSpacing="8">LARODEC</text>
        </svg>
      </div>
      <style>{`
        @keyframes logo-breathe {
          0%, 100% { transform: rotate(${rotate}deg) scale(1); }
          50% { transform: rotate(${rotate}deg) scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes logo-breathe {
            0%, 100% { transform: rotate(${rotate}deg) scale(1); }
          }
        }
      `}</style>
    </>
  );
}
