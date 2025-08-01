interface WaterLogoProps {
  className?: string;
  size?: number;
}
export function WaterLogo({
  className = "",
  size = 24
}: WaterLogoProps) {
  return (
    <img
      src="/src/assets/water-logo.png"
      alt="Mi Cole con Agua Segura"
      width={size}
      height={size}
      className={className}
    />
  );
}