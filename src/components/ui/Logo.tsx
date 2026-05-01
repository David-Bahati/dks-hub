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
 * Utilise un lien direct pour Google Drive afin de garantir l'affichage.
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

  // Format direct pour Google Drive (uc?export=view&id=)
  const fileId = "1kUOuBsul6BfUvpIeM1EYJ6Uo0qE8jPGX";
  const logoUrl = `https://docs.google.com/uc?export=view&id=${fileId}`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center overflow-hidden", sizeClasses[size])}>
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
