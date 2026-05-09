'use client';

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Logo Signature DKS Hub v4.0 - "The Core"
 * Fusion d'un monogramme royal et d'une architecture réseau.
 * Un emblème dynamique symbolisant l'autorité, la sécurité et la connectivité.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-14 w-14",
    lg: "h-28 w-28",
    xl: "h-48 w-48",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Symbole du Logo Signature */}
      <div className={cn("relative flex items-center justify-center group", sizeClasses[size])}>
        {/* Halo de lueur pulsante */}
        <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />
        
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all duration-700 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="dks_premium_grad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="0.5" stopColor="hsl(var(--accent))" />
              <stop offset="1" stopColor="hsl(var(--primary))" />
            </linearGradient>
            
            <filter id="neon_glow_master" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <style>
              {`
                @keyframes orbit {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .logo-ring {
                  transform-origin: center;
                  animation: orbit 20s linear infinite;
                }
                .logo-node {
                  animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 1; }
                }
              `}
            </style>
          </defs>

          {/* Anneau Orbital (Data Flow) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#dks_premium_grad)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            className="logo-ring opacity-20"
          />

          {/* Hexagone de Structure (Fond) */}
          <path
            d="M100 15L178.6 60V140L100 185L21.4 140V60L100 15Z"
            fill="black"
            fillOpacity="0.4"
            className="backdrop-blur-xl"
          />

          {/* Contour Hexagonal avec Noeuds aux angles */}
          <path
            d="M100 15L178.6 60V140L100 185L21.4 140V60L100 15Z"
            stroke="url(#dks_premium_grad)"
            strokeWidth="2"
            strokeOpacity="0.4"
          />

          {/* Micro-noeuds (Circuits) */}
          {[
            {cx: 100, cy: 15}, {cx: 178.6, cy: 60}, {cx: 178.6, cy: 140},
            {cx: 100, cy: 185}, {cx: 21.4, cy: 140}, {cx: 21.4, cy: 60}
          ].map((node, i) => (
            <circle key={i} cx={node.cx} cy={node.cy} r="4" fill="url(#dks_premium_grad)" className="logo-node" style={{animationDelay: `${i * 0.3}s`}} />
          ))}

          {/* Bouclier de Sécurité Interne (Symbolise la Trust) */}
          <path
            d="M100 45C100 45 135 55 135 85C135 125 100 145 100 145C100 145 65 125 65 85C65 55 100 45 100 45Z"
            fill="url(#dks_premium_grad)"
            fillOpacity="0.05"
            stroke="url(#dks_premium_grad)"
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />

          {/* Monogramme "Double King" Signature */}
          <g filter="url(#neon_glow_master)">
            {/* King 1 - Left */}
            <path
              d="M65 65V135M65 100L95 65M65 100L95 135"
              stroke="url(#dks_premium_grad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* King 2 - Right (Mirrored) */}
            <path
              d="M135 65V135M135 100L105 65M135 100L105 135"
              stroke="url(#dks_premium_grad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Cœur de Données (Core) */}
            <rect
              x="92"
              y="92"
              width="16"
              height="16"
              rx="4"
              fill="url(#dks_premium_grad)"
              className="animate-pulse"
            />
            <path
              d="M92 100H108M100 92V108"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className={cn(
            "font-black tracking-tighter uppercase italic leading-[0.7] flex items-baseline",
            textSizes[size]
          )}>
            <span>DKS</span>
            <span className="text-accent ml-2">HUB</span>
          </div>
          <div className="flex items-center gap-2 mt-3 ml-1">
            <div className="h-[1px] w-4 bg-accent/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/30 whitespace-nowrap">
              SOVEREIGN ECOSYSTEM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
