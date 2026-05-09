'use client';

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Logo Signature Double King Shop (DKS) - Design Ultra-Premium
 * Monogramme hexagonal complexe symbolisant le "Double King".
 * Fusion de géométrie sacrée et de circuits technologiques.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-14 w-14",
    lg: "h-24 w-24",
    xl: "h-40 w-40",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-6xl",
    xl: "text-8xl",
  };

  return (
    <div className={cn("flex items-center gap-5", className)}>
      {/* Symbole du Logo Signature */}
      <div className={cn("relative flex items-center justify-center group", sizeClasses[size])}>
        {/* Halo de lueur néon d'arrière-plan */}
        <div className="absolute inset-0 bg-accent/30 blur-[30px] rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-transform duration-700 group-hover:scale-110"
        >
          {/* Définitions des filtres et dégradés */}
          <defs>
            <linearGradient id="dks_gold_grad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="0.5" stopColor="hsl(var(--accent))" />
              <stop offset="1" stopColor="hsl(var(--primary))" />
            </linearGradient>
            
            <filter id="neon_glow_filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="inner_shadow">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="2" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.5" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Hexagone de structure (Géométrie Sacrée) */}
          <path
            d="M80 5L145 42.5V117.5L80 155L15 117.5V42.5L80 5Z"
            stroke="url(#dks_gold_grad)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            className="animate-pulse"
          />
          
          <path
            d="M80 15L136 47.5V112.5L80 145L24 112.5V47.5L80 15Z"
            fill="black"
            fillOpacity="0.6"
            className="backdrop-blur-md"
          />

          {/* Circuits de conduction internes */}
          <path
            d="M80 5V155M15 42.5L145 117.5M145 42.5L15 117.5"
            stroke="white"
            strokeOpacity="0.05"
            strokeWidth="0.5"
          />

          {/* Monogramme "Double King" - Deux K stylisés en miroir */}
          <g filter="url(#neon_glow_filter)">
            {/* K de Gauche (The First King) */}
            <path
              d="M45 45V115M45 80L75 45M45 80L75 115"
              stroke="url(#dks_gold_grad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            {/* K de Droite (The Second King) - Inversé */}
            <path
              d="M115 45V115M115 80L85 45M115 80L85 115"
              stroke="url(#dks_gold_grad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            {/* Lien Central (The Connection) */}
            <circle cx="80" cy="80" r="12" fill="url(#dks_gold_grad)" className="animate-pulse" />
            <path d="M72 80H88M80 72V88" stroke="black" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Ornements de Couronne Technologique */}
          <path
            d="M65 25L80 10L95 25"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-60"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-black tracking-tighter uppercase italic leading-[0.8] text-foreground",
            textSizes[size]
          )}>
            DKS <span className="text-accent font-light not-italic">Hub</span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground mt-3 ml-1 opacity-40">
            Sovereign Technology
          </span>
        </div>
      )}
    </div>
  );
}
