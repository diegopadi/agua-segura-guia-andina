interface WaterLogoProps {
  className?: string
  size?: number
}

export function WaterLogo({ className = "", size = 24 }: WaterLogoProps) {
  const fontSize = size / 24 // Escala basada en el tamaño por defecto
  
  return (
    <span 
      className={`font-bold text-primary ${className}`}
      style={{ fontSize: `${fontSize}rem` }}
    >
      Mi Cole
    </span>
  )
}