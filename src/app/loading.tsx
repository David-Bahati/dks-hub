import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
      <div className="loading-bar" />
      <div className="relative">
        <Logo size="xl" className="spinner-glow" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest text-accent/80">Chargement...</span>
        </div>
      </div>
    </div>
  );
}
