'use client';

import Image from 'next/image';
import clsx from 'clsx';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div className={clsx("relative rounded-full overflow-hidden shrink-0", className)} style={{ width: size, height: size }}>
       {/* 
         Note: We assume the user has uploaded 'logo.jpg' or 'logo.png' into the public directory.
         Using an unoptimized img tag to avoid next/image domain or missing file errors breaking the build.
         If 'logo.jpg' is naturally a dark background, we won't need to add styling.
       */}
       <img 
         src="/logo.jpg" 
         alt="Nanoware AI Logo" 
         className="w-full h-full object-cover"
         onError={(e) => {
           // Fallback if the file isn't uploaded yet or has a different extension
           const target = e.target as HTMLImageElement;
           if (!target.src.includes('logo.png') && target.src.includes('logo.jpg')) {
              target.src = '/logo.png';
           } else {
             target.style.display = 'none';
             if (target.parentElement) {
               target.parentElement.innerHTML = '<div class="w-full h-full bg-brand-secondary text-white flex items-center justify-center font-heading font-bold text-sm tracking-tighter">N</div>';
             }
           }
         }}
       />
    </div>
  );
}
