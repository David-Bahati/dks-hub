import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

/**
 * Composant Logo centralisé pour l'application DKS.
 * Permet de changer le logo partout en modifiant un seul fichier.
 */
export function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-base",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-24 h-24 text-5xl",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className={cn(
        "rounded-[1.25rem] bg-primary flex items-center justify-center neon-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
        sizeClasses[size]
      )}>
        {/* Placeholder pour le logo textuel actuel, facile à remplacer par un <img /> ou un <svg /> */}
        <span className="text-white font-black italic uppercase tracking-tighter">dks</span>
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
