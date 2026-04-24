
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  ShieldCheck, 
  Coins, 
  Smartphone, 
  Zap, 
  ArrowRight,
  Monitor,
  MousePointer2,
  Keyboard
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Simplifié */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center neon-glow">
              <span className="text-white font-bold text-lg">dks</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Shop<span className="text-accent">Manager</span></span>
          </div>
          <div className="flex gap-4">
            <Link href="/shop">
              <Button variant="ghost" className="text-sm">Boutique</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-sm">Espace Pro</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]" />
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-accent/10 text-accent border-accent/20 px-4 py-1.5 animate-bounce">
            Nouveau : Paiements Pi Network Disponibles 🚀
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black font-headline mb-8 tracking-tighter leading-tight">
            VOTRE SETUP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">NEXT GEN</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Découvrez le meilleur du matériel informatique haut de gamme. 
            Une expérience d'achat fluide avec paiement en Pi, Mobile Money ou Cash.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/shop">
              <Button size="lg" className="h-16 px-8 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 neon-glow gap-2">
                <ShoppingCart size={20} />
                Passer Commande
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="h-16 px-8 text-lg border-white/10 hover:bg-white/5 gap-2">
                Voir le Catalogue
                <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/10 hover:border-accent/50 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Coins className="text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Pi Network</h3>
              <p className="text-muted-foreground">Pionniers du Web3, nous acceptons vos Pi pour tout achat d'équipement pro.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/10 hover:border-accent/50 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Smartphone className="text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mobile Money</h3>
              <p className="text-muted-foreground">Règlement instantané via vos opérateurs locaux pour une sécurité maximale.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/10 hover:border-accent/50 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Zap className="text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Service Express</h3>
              <p className="text-muted-foreground">Traitement de commande en temps réel et livraison prioritaire pour les setups pro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-center">NOS UNIVERS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="group relative h-64 rounded-3xl overflow-hidden border border-white/10">
              <img src="https://picsum.photos/seed/keyboard-hero/800/600" alt="Keyboards" className="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <Keyboard className="text-accent" />
                <span className="text-2xl font-bold uppercase tracking-widest">Périphériques</span>
              </div>
            </div>
            <div className="group relative h-64 rounded-3xl overflow-hidden border border-white/10">
              <img src="https://picsum.photos/seed/monitor-hero/800/600" alt="Monitors" className="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <Monitor className="text-accent" />
                <span className="text-2xl font-bold uppercase tracking-widest">Écrans 4K</span>
              </div>
            </div>
            <div className="group relative h-64 rounded-3xl overflow-hidden border border-white/10">
              <img src="https://picsum.photos/seed/mouse-hero/800/600" alt="Gaming Gear" className="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <MousePointer2 className="text-accent" />
                <span className="text-2xl font-bold uppercase tracking-widest">Accessoires</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-white/5 bg-card">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs uppercase">dks</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Shop<span className="text-accent">Manager</span></span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 dks Group. Tous droits réservés. Propulsé par Pi Network.</p>
          <div className="flex gap-6 text-muted-foreground">
             <ShieldCheck size={20} className="hover:text-accent cursor-pointer transition-colors" />
             <Coins size={20} className="hover:text-accent cursor-pointer transition-colors" />
             <Smartphone size={20} className="hover:text-accent cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
