import waterLogo from "@/assets/water-logo.png"

interface WaterLogoProps {
  className?: string
  size?: number
}

export function WaterLogo({ className = "", size = 24 }: WaterLogoProps) {
  return (
    <img
      src={waterLogo}
      alt="Mi Cole con Agua Segura"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  )
}