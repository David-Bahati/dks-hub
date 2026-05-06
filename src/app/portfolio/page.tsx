
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Globe, 
    Cpu, 
    ShieldCheck, 
    Zap, 
    Laptop, 
    ArrowRight, 
    Loader2, 
    Network, 
    Video, 
    Layout, 
    Eye,
    SortDesc,
    Calendar,
    TrendingUp,
    Search,
    X,
    Share2
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, increment } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Project } from '@/lib/types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, any> = {
    "Zap": Zap,
    "Globe": Globe,
    "Video": Video,
    "Network": Network,
    "Cpu": Cpu,
    "Layout": Layout,
};

export default function PortfolioPage() {
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const projectsQuery = useMemoFirebase(() => {
    return query(collection(db, "projects"), where("isPublished", "==", true), orderBy("createdAt", "desc"));
  }, []);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const filteredAndSortedProjects = useMemo(() => {
    if (!projects) return [];
    
    let items = [...projects];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.client?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (sortBy === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      items.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
      });
    }

    return items;
  }, [projects, sortBy, searchTerm]);

  useEffect(() => {
    if (projects && projects.length > 0) {
        projects.forEach(project => {
            const sessionKey = `viewed_project_${project.id}`;
            if (!sessionStorage.getItem(sessionKey)) {
                const projectRef = doc(db, "projects", project.id);
                updateDoc(projectRef, {
                    views: increment(1)
                }).catch(e => console.error("Error incrementing views:", e));
                sessionStorage.setItem(sessionKey, 'true');
            }
        });
    }
  }, [projects]);

  const handleShare = async (project: Project) => {
    const shareData = {
        title: `DKS Excellence: ${project.title}`,
        text: `Découvrez la réalisation de Double King Shop pour ${project.client} : ${project.description}`,
        url: window.location.href,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            toast({ title: "Partage réussi", description: "Merci de faire rayonner l'excellence DKS." });
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title} - ${shareData.url}`)}`;
        window.open(whatsappUrl, '_blank');
        toast({ title: "Lien WhatsApp ouvert", description: "Partagez la réalisation avec vos contacts." });
    }
  };

  const getIcon = (name: string) => {
    const IconComp = ICON_MAP[name] || Zap;
    return <IconComp size={20} />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.2em] px-5 py-2">Nos Réalisations</Badge>
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">DKS <span className="text-accent">EXCELLENCE</span></h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Découvrez comment nous transformons le paysage technologique de Bunia, projet après projet.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16 max-w-4xl mx-auto">
            <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input 
                    placeholder="Chercher un client, une technologie..." 
                    className="h-16 pl-12 pr-12 bg-white/5 border-white/10 rounded-2xl focus:border-accent transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="bg-white/5 border border-white/10 p-1.5 rounded-[1.5rem] flex items-center gap-2 shrink-0">
                <button 
                    onClick={() => setSortBy('recent')}
                    className={cn(
                        "px-6 h-12 rounded-xl font-black uppercase italic text-[10px] flex items-center gap-2 transition-all",
                        sortBy === 'recent' ? "bg-accent text-black shadow-lg" : "text-white/40 hover:text-white"
                    )}
                >
                    <Calendar size={14} /> Récents
                </button>
                <button 
                    onClick={() => setSortBy('views')}
                    className={cn(
                        "px-6 h-12 rounded-xl font-black uppercase italic text-[10px] flex items-center gap-2 transition-all",
                        sortBy === 'views' ? "bg-accent text-black shadow-lg" : "text-white/40 hover:text-white"
                    )}
                >
                    <TrendingUp size={14} /> Populaires
                </button>
            </div>
        </div>

        {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
        ) : filteredAndSortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredAndSortedProjects.map((project) => (
                <Card key={project.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group">
                <div className="aspect-video relative overflow-hidden">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                        <Badge className="bg-accent text-black font-black uppercase text-[10px]">{project.category}</Badge>
                        <Badge variant="secondary" className="bg-black/40 text-white border-white/10 text-[8px] font-black gap-1"><Eye size={10} /> {project.views || 0} vues</Badge>
                    </div>
                    <button 
                        onClick={() => handleShare(project)}
                        className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-black hover:border-accent transition-all opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 shadow-2xl"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black uppercase italic leading-tight flex items-center gap-3">
                        <div className="text-accent">{getIcon(project.iconName)}</div>
                        {project.title}
                    </CardTitle>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Client: {project.client}</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-3">"{project.description}"</p>
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
                {searchTerm ? <Search size={80} strokeWidth={1} /> : <Layout size={80} strokeWidth={1} />}
                <p className="text-xl font-black uppercase italic tracking-tighter">
                    {searchTerm ? "Aucun résultat trouvé" : "Portfolio en cours de mise à jour..."}
                </p>
                {searchTerm && <Button onClick={() => setSearchTerm("")} variant="link" className="text-accent uppercase font-black italic">Effacer la recherche</Button>}
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
