'use client';

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Composant Logo épuré en Flat Design.
 * Supprime le contour et le fond pour une intégration transparente.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  // URL directe du logo
  const logoUrl = "https://lh3.googleusercontent.com/u/0/d/1kUOuBsul6BfUvpIeM1EYJ6Uo0qE8jPGX";

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className={cn(
        "flex items-center justify-center transition-all duration-500 group-hover:scale-110",
        sizeClasses[size]
      )}>
        <img 
          src={logoUrl} 
          alt="DKS Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {showText && (
        <span className={cn(
          "font-black tracking-tighter uppercase italic leading-none",
          textSizes[size]
        )}>
          Double King <span className="text-accent">Shop</span>
        </span>
      )}
    </div>
  );
}
