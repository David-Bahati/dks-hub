'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Cpu, ShieldCheck, Zap, Laptop, ArrowRight } from "lucide-react";
import Image from "next/image";

const PROJECTS = [
  {
    title: "Infrastructure Wi-Fi Immeuble Bahati",
    client: "Bailleur Immeuble Bahati",
    category: "Infrastructure",
    description: "Déploiement d'un réseau maillé haute performance couvrant 4 étages avec gestion centralisée des accès.",
    image: "https://picsum.photos/seed/network/800/600",
    tags: ["UniFi", "Fibre Optique", "Hotspot"]
  },
  {
    title: "Setup Gaming Elite pour Pro-Player",
    client: "Client Privé - Bunia",
    category: "Custom Build",
    description: "Montage d'une machine de guerre équipée d'une RTX 4090, avec refroidissement liquide sur mesure et optimisation pour le streaming.",
    image: "https://picsum.photos/seed/gamingpc/800/600",
    tags: ["RTX 4090", "Custom Loop", "Overclocking"]
  },
  {
    title: "Digitalisation Point de Vente",
    client: "Commerce Local",
    category: "Digitalisation",
    description: "Installation d'un système POS complet avec gestion de stock en temps réel et paiement Mobile Money intégré.",
    image: "https://picsum.photos/seed/pos/800/600",
    tags: ["POS System", "Cloud Inventory"]
  }
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20 space-y-4">
          <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.2em] px-5 py-2">Nos Réalisations</Badge>
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">DKS <span className="text-accent">EXCELLENCE</span></h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Découvrez comment nous transformons le paysage technologique de Bunia, projet après projet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {PROJECTS.map((project, idx) => (
            <Card key={idx} className="glossy-card border-none rounded-[3rem] overflow-hidden group">
              <div className="aspect-video relative overflow-hidden">
                <img src={project.image} alt={project.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <Badge className="absolute top-6 right-6 bg-accent text-black font-black uppercase text-[10px]">{project.category}</Badge>
              </div>
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black uppercase italic leading-tight">{project.title}</CardTitle>
                <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Client: {project.client}</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-white/10 text-[9px] uppercase font-bold text-white/40">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-32 p-12 rounded-[3rem] bg-accent/5 border border-accent/10 relative overflow-hidden text-center">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
            <h2 className="text-4xl font-black uppercase italic mb-6">UN PROJET COMPLEXE ?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Nos experts se déplacent partout à Bunia pour auditer vos besoins et proposer des solutions sur mesure.
            </p>
            <Button className="h-16 px-12 rounded-2xl bg-accent text-black font-black uppercase italic text-lg shadow-xl shadow-accent/20">
                Lancer une Consultation <ArrowRight size={24} className="ml-3" />
            </Button>
        </section>
      </main>
    </div>
  );
}
