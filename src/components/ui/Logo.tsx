
'use client';

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Composant Logo Flat Design Épuré.
 * Un design moderne utilisant des formes géométriques et des dégradés subtils.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Symbole du Logo : Un double 'K' stylisé ou une couronne abstraite */}
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]"
        >
          {/* Base du logo */}
          <rect width="100" height="100" rx="24" fill="url(#logo_grad)" />
          
          {/* Symbole Central (Double King stylisé) */}
          <path
            d="M30 30L50 50L70 30V70L50 50L30 70V30Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M50 20L60 35H40L50 20Z"
            fill="white"
          />

          <defs>
            <linearGradient id="logo_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="1" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <span className={cn(
          "font-black tracking-tighter uppercase italic leading-none text-foreground",
          textSizes[size]
        )}>
          DKS <span className="text-accent font-light not-italic">Shop</span>
        </span>
      )}
    </div>
  );
}
