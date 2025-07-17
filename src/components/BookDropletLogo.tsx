import React from 'react'

interface BookDropletLogoProps {
  className?: string
  size?: number
}

export function BookDropletLogo({ className, size = 24 }: BookDropletLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Book - Open pages */}
      <path 
        d="M3 6C3 4.34315 4.34315 3 6 3H9C10.6569 3 12 4.34315 12 6V18C12 19.1046 11.1046 20 10 20H6C4.89543 20 4 19.1046 4 18V6H3Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M12 6C12 4.34315 13.3431 3 15 3H18C19.6569 3 21 4.34315 21 6V18C21 19.1046 20.1046 20 19 20H15C13.8954 20 13 19.1046 13 18V6H12Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      {/* Book spine/binding */}
      <line 
        x1="12" 
        y1="3" 
        x2="12" 
        y2="20" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      
      {/* Water droplet */}
      <path 
        d="M18.5 8C18.5 8 20.5 10.5 20.5 12C20.5 13.3807 19.3807 14.5 18 14.5C16.6193 14.5 15.5 13.3807 15.5 12C15.5 10.5 17.5 8 17.5 8C17.7761 7.66667 18.2239 7.66667 18.5 8Z" 
        fill="hsl(var(--secondary))" 
        stroke="hsl(var(--secondary))" 
        strokeWidth="0.5"
      />
    </svg>
  )
}