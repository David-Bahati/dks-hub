
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Cpu, ShieldCheck, Zap, Laptop, ArrowRight, Loader2, Network, Video, Layout } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Project } from '@/lib/types';

const ICON_MAP: Record<string, any> = {
    "Zap": Zap,
    "Globe": Globe,
    "Video": Video,
    "Network": Network,
    "Cpu": Cpu,
    "Layout": Layout,
};

export default function PortfolioPage() {
  const projectsQuery = useMemoFirebase(() => {
    return query(collection(db, "projects"), where("isPublished", "==", true), orderBy("createdAt", "desc"));
  }, []);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const getIcon = (name: string) => {
    const IconComp = ICON_MAP[name] || Zap;
    return <IconComp size={20} />;
  };

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

        {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
        ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project) => (
                <Card key={project.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group">
                <div className="aspect-video relative overflow-hidden">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <Badge className="absolute top-6 right-6 bg-accent text-black font-black uppercase text-[10px]">{project.category}</Badge>
                </div>
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black uppercase italic leading-tight flex items-center gap-3">
                        <div className="text-accent">{getIcon(project.iconName)}</div>
                        {project.title}
                    </CardTitle>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Client: {project.client}</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{project.description}"</p>
                    <div className="flex flex-wrap gap-2">
                    {project.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="border-white/10 text-[9px] uppercase font-bold text-white/40">{tag}</Badge>
                    ))}
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
            <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                <Layout size={80} strokeWidth={1} />
                <p className="text-xl font-black uppercase italic tracking-tighter">Portfolio en cours de mise à jour...</p>
            </div>
        )}

        <section className="mt-32 p-12 rounded-[3rem] bg-accent/5 border border-accent/10 relative overflow-hidden text-center">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
            <h2 className="text-4xl font-black uppercase italic mb-6">UN PROJET COMPLEXE ?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Nos experts se déplacent partout à Bunia pour auditer vos besoins et proposer des solutions sur mesure.
            </p>
            <Link href="/services/audit">
                <Button className="h-16 px-12 rounded-2xl bg-accent text-black font-black uppercase italic text-lg shadow-xl shadow-accent/20">
                    Lancer une Consultation <ArrowRight size={24} className="ml-3" />
                </Button>
            </Link>
        </section>
      </main>
    </div>
  );
}
