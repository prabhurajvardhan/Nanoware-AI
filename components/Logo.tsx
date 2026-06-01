'use client';

import clsx from 'clsx';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div 
      className={clsx("relative rounded-full shrink-0 flex items-center justify-center bg-[#070e17]", className)} 
      style={{ width: size, height: size, padding: size * 0.05 }}
    >
      <svg 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full text-white"
        fill="currentColor"
      >
        {/* Outer Circle */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.9" />
        
        {/* N Left Stem */}
        <path d="M35,32 L35,58" stroke="currentColor" strokeWidth="2.5" />
        <path d="M31,32 L39,32" stroke="currentColor" strokeWidth="1" />
        <path d="M31,58 L39,58" stroke="currentColor" strokeWidth="1" />
        
        {/* N Right Stem */}
        <path d="M60,32 L60,55" stroke="currentColor" strokeWidth="2.5" />
        <path d="M56,32 L64,32" stroke="currentColor" strokeWidth="1" />
        
        {/* Swooping Diagonal */}
        <path d="M28,28 Q45,28 50,45 Q55,62 76,64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M28,28 Q45,28 50,45 Q55,62 76,64" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        
        {/* Text */}
        <text x="50" y="74" fontFamily="Georgia, serif" fontSize="6.5" fill="currentColor" textAnchor="middle" letterSpacing="0.15em">
          NANOWARE AI
        </text>
      </svg>
    </div>
  );
}
