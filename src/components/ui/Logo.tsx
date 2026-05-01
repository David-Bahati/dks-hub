'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Composant Logo centralisé utilisant l'image fournie par l'utilisateur.
 * Gère un repli textuel en cas d'erreur de chargement de l'image.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const [hasError, setHasError] = useState(false);
  
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

  // Lien direct vers l'image du logo
  const logoUrl = "https://lh3.googleusercontent.com/u/0/d/1kUOuBsul6BfUvpIeM1EYJ6Uo0qE8jPGX";

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className={cn(
        "rounded-[1.25rem] bg-white overflow-hidden flex items-center justify-center neon-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-white/10",
        sizeClasses[size]
      )}>
        {!hasError ? (
          <img 
            src={logoUrl} 
            alt="DKS Logo" 
            className="w-full h-full object-contain p-1"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="text-primary font-black italic">DKS</span>
        )}
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
