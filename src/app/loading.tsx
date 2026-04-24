import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
      <div className="loading-bar" />
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center neon-glow spinner-glow">
          <span className="text-white font-black text-3xl italic">dks</span>
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest text-accent/80">Chargement...</span>
        </div>
      </div>
    </div>
  );
}