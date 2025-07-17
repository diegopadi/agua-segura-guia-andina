interface WaterLogoProps {
  className?: string
  size?: number
}

export function WaterLogo({ className = "", size = 24 }: WaterLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Escudo exterior - color turquesa oscuro */}
      <path
        d="M100 20C60 20 20 40 20 80C20 160 100 220 100 220C100 220 180 160 180 80C180 40 140 20 100 20Z"
        fill="#0d7377"
      />
      
      {/* Escudo interior - color turquesa claro */}
      <path
        d="M100 35C68 35 40 50 40 85C40 150 100 200 100 200C100 200 160 150 160 85C160 50 132 35 100 35Z"
        fill="#14a085"
      />
      
      {/* Gota de agua principal - azul oscuro */}
      <path
        d="M100 70C90 80 75 95 75 115C75 128.807 86.193 140 100 140C113.807 140 125 128.807 125 115C125 95 110 80 100 70Z"
        fill="#0f4c75"
      />
      
      {/* Gota de agua interior - azul claro */}
      <path
        d="M100 80C93 87 83 97 83 110C83 118.284 89.716 125 98 125C106.284 125 113 118.284 113 110C113 97 107 87 100 80Z"
        fill="#3282b8"
      />
      
      {/* Brillo en la gota */}
      <ellipse
        cx="95"
        cy="105"
        rx="6"
        ry="10"
        fill="white"
        opacity="0.6"
      />
    </svg>
  )
}