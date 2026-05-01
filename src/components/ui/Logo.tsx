'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Composant Logo épuré en Flat Design.
 * Intégration directe de l'image sur fond transparent.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
    xl: "h-24 w-auto",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  // Lien direct optimisé pour Google Drive (uc?id=)
  const fileId = "1kUOuBsul6BfUvpIeM1EYJ6Uo0qE8jPGX";
  const logoUrl = `https://docs.google.com/uc?id=${fileId}`;

  return (
    <div className={cn("flex items-center gap-3 transition-opacity duration-300", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {!error ? (
          <img 
            src={logoUrl} 
            alt="DKS Logo" 
            className="h-full w-auto object-contain"
            onError={() => setError(true)}
          />
        ) : (
          <div className="text-primary font-black italic text-xl">
            DKS
          </div>
        )}
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
