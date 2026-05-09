
'use client';

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Logo Double King Shop (DKS) - Design Premium "Elite Hub"
 * Un monogramme symétrique formant une couronne technologique.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-20 w-20",
    xl: "h-32 w-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Symbole du Logo */}
      <div className={cn("relative flex items-center justify-center group", sizeClasses[size])}>
        {/* Glow de fond pour l'effet Premium */}
        <div className="absolute inset-0 bg-accent/20 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
        >
          {/* Hexagone de structure (Tech feel) */}
          <path
            d="M60 5L107.6 32.5V87.5L60 115L12.4 87.5V32.5L60 5Z"
            fill="url(#dks_grad_main)"
            className="transition-all duration-500"
          />
          
          {/* Lignes de brillance interne */}
          <path
            d="M60 5L107.6 32.5V87.5L60 115"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />

          {/* Monogramme "Double King" symétrique (Deux K formant une couronne) */}
          <path
            d="M35 35V85L50 60L35 35ZM85 35V85L70 60L85 35Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M50 60L60 45L70 60V85H50V60Z"
            fill="white"
            fillOpacity="0.95"
          />
          
          {/* Sommet de la couronne (Le King) */}
          <path
            d="M60 25L68 38H52L60 25Z"
            fill="white"
          />

          <defs>
            <linearGradient id="dks_grad_main" x1="12.4" y1="5" x2="107.6" y2="115" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="1" stopColor="hsl(var(--accent))" />
            </linearGradient>
            
            <filter id="neon_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-black tracking-tighter uppercase italic leading-none text-foreground",
            textSizes[size]
          )}>
            DKS <span className="text-accent font-light not-italic">Hub</span>
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-muted-foreground mt-1 ml-1 opacity-50">
            Technological Excellence
          </span>
        </div>
      )}
    </div>
  );
}
