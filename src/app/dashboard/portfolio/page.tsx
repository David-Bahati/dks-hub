
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, Eye, EyeOff, Layout, Globe, Video, Zap, Network, Cpu } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const projectSchema = z.object({
  title: z.string().min(5, "Le titre est trop court"),
  client: z.string().min(2, "Nom du client requis"),
  category: z.string().min(2, "Catégorie requise"),
  description: z.string().min(10, "La description doit être plus détaillée"),
  imageUrl: z.string().url("URL d'image invalide").or(z.string().length(0)),
  iconName: z.string().default("Zap"),
  isPublished: z.boolean().default(true),
});

const ICON_OPTIONS = [
    { value: "Zap", icon: Zap },
    { value: "Globe", icon: Globe },
    { value: "Video", icon: Video },
    { value: "Network", icon: Network },
    { value: "Cpu", icon: Cpu },
    { value: "Layout", icon: Layout },
];

function PortfolioManagementPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const projectsQuery = useMemoFirebase(() => query(collection(db, "projects"), orderBy("createdAt", "desc")), []);
  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      client: "",
      category: "Infrastructure",
      description: "",
      imageUrl: "",
      iconName: "Zap",
      isPublished: true,
    },
  });

  const handleOpenSheet = (project: Project | null = null) => {
    setEditingProject(project);
    if (project) {
      form.reset({
        title: project.title,
        client: project.client,
        category: project.category,
        description: project.description,
        imageUrl: project.imageUrl,
        iconName: project.iconName || "Zap",
        isPublished: project.isPublished,
      });
    } else {
      form.reset({
        title: "",
        client: "",
        category: "Infrastructure",
        description: "",
        imageUrl: "",
        iconName: "Zap",
        isPublished: true,
      });
    }
    setIsSheetOpen(true);
  };

  async function onSubmit(values: z.infer<typeof projectSchema>) {
    const projectData = {
      ...values,
      imageUrl: values.imageUrl || `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/600`,
      tags: [values.category],
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), projectData);
        toast({ title: "Projet mis à jour" });
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Réalisation ajoutée au Portfolio" });
      }
      setIsSheetOpen(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le projet.", variant: "destructive" });
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer définitivement cette réalisation ?")) {
      try {
        await deleteDoc(doc(db, "projects", id));
        toast({ title: "Projet supprimé" });
      } catch (error) {
        toast({ title: "Erreur", variant: "destructive" });
      }
    }
  };

  const getIcon = (name: string) => {
      const opt = ICON_OPTIONS.find(o => o.value === name);
      const IconComp = opt?.icon || Zap;
      return <IconComp size={20} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-12 gap-4">
          <div className="flex items-start gap-4">
             <Link href="/dashboard">
                <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                    <ArrowLeft size={20} />
                </Button>
             </Link>
             <div>
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Gestion <span className="text-accent">Portfolio</span></h1>
                <p className="text-muted-foreground text-xs uppercase font-black opacity-40">Mise en avant de l'Excellence DKS</p>
             </div>
          </div>
          
          <Button onClick={() => handleOpenSheet()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic rounded-xl h-12 px-6 shadow-xl">
              <Plus size={18} /> Nouvelle Réalisation
          </Button>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects && projects.length > 0 ? projects.map((project) => (
                <Card key={project.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                   <div className="aspect-video relative overflow-hidden">
                       <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                       <div className="absolute top-4 right-4 flex gap-2">
                           <Badge className={cn("border-none text-[8px] font-black uppercase px-2", project.isPublished ? "bg-green-500/80 text-white" : "bg-orange-500/80 text-white")}>
                               {project.isPublished ? "Publié" : "Brouillon"}
                           </Badge>
                       </div>
                   </div>
                   <CardContent className="p-8 space-y-4">
                       <div className="flex items-center gap-3">
                           <div className="text-accent">{getIcon(project.iconName)}</div>
                           <h3 className="text-xl font-black uppercase italic tracking-tight truncate">{project.title}</h3>
                       </div>
                       <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Client: {project.client}</p>
                       <p className="text-xs text-muted-foreground line-clamp-2 italic">"{project.description}"</p>
                       <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                           <Button variant="ghost" size="icon" onClick={() => handleOpenSheet(project)} className="h-10 w-10 hover:text-accent"><Edit2 size={16}/></Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)} className="h-10 w-10 hover:text-destructive"><Trash2 size={16}/></Button>
                       </div>
                   </CardContent>
                </Card>
            )) : (
                <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                    <Layout size={64} strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-widest">Aucun projet en portfolio.</p>
                </div>
            )}
            </div>
        )}
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingProject ? 'Modifier' : 'Ajouter'} une Réalisation
                </SheetTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Preuve d'Excellence Hub</p>
            </SheetHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Titre du Chantier</FormLabel>
                            <FormControl><Input {...field} placeholder="Ex: Wi-Fi Maillé Immeuble Bahati" className="h-12 bg-background/50 border-white/5 rounded-xl font-bold" /></FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="client"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Client</FormLabel>
                                <FormControl><Input {...field} placeholder="Nom de l'entité" className="h-12 bg-background/50 border-white/5 rounded-xl" /></FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Catégorie</FormLabel>
                                <FormControl><Input {...field} placeholder="Ex: Infrastructure" className="h-12 bg-background/50 border-white/5 rounded-xl" /></FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                      </div>

                      <FormField
                        control={form.control}
                        name="iconName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Icône représentative</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl font-bold uppercase text-[10px]">
                                        <SelectValue placeholder="Choisir une icône" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-card border-white/10">
                                    {ICON_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase">
                                            <div className="flex items-center gap-2"><opt.icon size={14}/> {opt.value}</div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">URL Image (laisser vide pour random)</FormLabel>
                            <FormControl><Input {...field} placeholder="https://..." className="h-12 bg-background/50 border-white/5 rounded-xl text-[10px] font-mono" /></FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Détails techniques</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[100px] bg-background/50 border-white/5 rounded-2xl text-xs italic" /></FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <FormLabel className="font-bold text-xs uppercase">Visibilité Publique</FormLabel>
                                <p className="text-[8px] text-muted-foreground uppercase">Afficher sur l'accueil et portfolio</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-accent" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                  </div>
                  
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10">
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : editingProject ? "Enregistrer les modifications" : "Publier la Réalisation"}
                  </Button>
              </form>
            </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(PortfolioManagementPage);
