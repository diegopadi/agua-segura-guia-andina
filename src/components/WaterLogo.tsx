interface WaterLogoProps {
  className?: string
  size?: number
}

export function WaterLogo({ className = "", size = 24 }: WaterLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Escudo principal */}
      <path
        d="M50 10C30 10 15 25 15 45C15 65 30 85 50 90C70 85 85 65 85 45C85 25 70 10 50 10Z"
        fill="hsl(var(--secondary))"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
      />
      
      {/* Gota de agua */}
      <path
        d="M50 25C45 30 35 40 35 50C35 58.284 41.716 65 50 65C58.284 65 65 58.284 65 50C65 40 55 30 50 25Z"
        fill="hsl(var(--accent))"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />
      
      {/* Brillo en la gota */}
      <ellipse
        cx="47"
        cy="45"
        rx="4"
        ry="6"
        fill="hsl(var(--card))"
        opacity="0.7"
      />
    </svg>
  )
}