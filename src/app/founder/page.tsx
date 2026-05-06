
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
    User, 
    ArrowLeft, 
    Mail, 
    Smartphone, 
    MapPin, 
    GraduationCap, 
    Briefcase, 
    Cpu, 
    CheckCircle2, 
    Award, 
    Globe, 
    BookOpen,
    ShieldCheck,
    Languages,
    Database,
    Zap,
    MessageSquare,
    Terminal,
    History
} from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/Logo";

export default function FounderPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            
            {/* HERO IDENTITY */}
            <header className="relative py-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
                <div className="container max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
                    <Link href="/">
                        <Button variant="ghost" className="mb-12 gap-2 text-muted-foreground hover:text-accent font-black uppercase italic text-[10px] tracking-widest">
                            <ArrowLeft size={14} /> Retour au Hub
                        </Button>
                    </Link>
                    
                    <div className="w-40 h-40 rounded-[3rem] bg-accent/20 flex items-center justify-center mb-8 text-accent shadow-[0_0_50px_rgba(56,189,248,0.2)]">
                        <User size={80} />
                    </div>

                    <Badge className="bg-accent text-black font-black uppercase italic px-6 py-1.5 mb-6 text-[10px] tracking-[0.3em] rounded-full">
                        Fondateur & CEO • Expert Systèmes
                    </Badge>
                    
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-6">
                        BAHATI NYEKE <br /><span className="text-accent">DAVID</span>
                    </h1>
                    
                    <p className="text-lg text-white/60 font-light max-w-2xl mx-auto italic leading-relaxed">
                        "Prendre les valeurs de sérieux et d'apprentissage pour traduire les acquisitions en résultats palpables pour l'avenir technologique de l'Ituri."
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 mt-12">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <Mail size={14} className="text-accent" /> bahatinyeke@gmail.com
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <Smartphone size={14} className="text-accent" /> +243 823 038 945
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <MapPin size={14} className="text-accent" /> Bunia, Ituri, RDC
                        </div>
                    </div>
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-6 space-y-32">
                
                {/* SECTION: ACADEMIC PATH */}
                <section>
                    <div className="flex items-center gap-6 mb-16">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                            <GraduationCap className="text-primary" /> Parcours Académique
                        </h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { year: "2018 - 2021", school: "Université Shalom de Bunia", degree: "Gradué en Administration et Gestion", dept: "Système Informatique de Gestion" },
                            { year: "2012 - 2018", school: "Institut II Diangienda", degree: "Diplôme d'État en Commerciale Informatique", dept: "Bunia" },
                            { year: "2005 - 2012", school: "EP. IGA Barriere", degree: "Certificat d'Étude Primaire", dept: "IGA Barriere" }
                        ].map((edu, idx) => (
                            <Card key={idx} className="bg-white/5 border-white/5 rounded-[2.5rem] p-10 hover:bg-white/[0.08] transition-all">
                                <Badge className="bg-primary/20 text-primary border-none mb-6">{edu.year}</Badge>
                                <h3 className="text-xl font-black uppercase italic leading-tight mb-2">{edu.school}</h3>
                                <p className="text-xs text-white/60 font-bold uppercase tracking-widest mb-4">{edu.degree}</p>
                                <p className="text-[10px] text-primary font-black uppercase italic opacity-40">{edu.dept}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* SECTION: EXPERIENCE RADAR */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    <div className="lg:col-span-5 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">EXPÉRIENCE <br /><span className="text-accent">D'EXCELLENCE</span></h2>
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                Un parcours forgé au cœur des organisations internationales et des infrastructures régionales, combinant rigueur analytique et engagement terrain.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Compétences Techniques</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-xs font-black uppercase italic">Systèmes & Réseaux</span><Smartphone size={16} className="text-accent" /></div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">Windows</Badge>
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">Android</Badge>
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">Starlink</Badge>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-xs font-black uppercase italic">Programmation</span><Terminal size={16} className="text-accent" /></div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">C / C++</Badge>
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">HTML / Web</Badge>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-xs font-black uppercase italic">Bureautique Pro</span><Database size={16} className="text-accent" /></div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">Excel Expert</Badge>
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">Word</Badge>
                                        <Badge variant="outline" className="text-[8px] border-white/10 uppercase">PowerPoint</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-8">
                        <div className="relative pl-12 space-y-12 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-px before:bg-white/10">
                            {[
                                { title: "Administrateur Gérant", org: "Etablissement MON AMI Bunia", period: "2021 - 2022", desc: "Pilotage stratégique et gestion opérationnelle de l'établissement." },
                                { title: "Data Entry & Saisie", org: "ONG COOPI-EST Goma", period: "2020 - 2021", desc: "Gestion des bases de données humanitaires et flux d'informations." },
                                { title: "Enquêteur Terrain", org: "MSF (Médecins Sans Frontières)", period: "2019 - 2020", desc: "Collecte de données critiques en zones de déplacés (NIZI)." },
                                { title: "Stage Académique", org: "REGIDESO Bunia", period: "2021", desc: "Analyse des systèmes de gestion des ressources hydrauliques." },
                                { title: "Enquêteur Senior", org: "NRC (Norwegian Council Refugees)", period: "2020", desc: "Évaluation des besoins dans les sites de guerre de NYAMAZAZI." }
                            ].map((exp, i) => (
                                <div key={i} className="relative group">
                                    <div className="absolute left-[-52px] top-1 w-10 h-10 rounded-xl bg-background border border-white/10 flex items-center justify-center group-hover:border-accent transition-colors">
                                        <History size={16} className="text-white/20 group-hover:text-accent transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <Badge className="bg-white/5 text-accent border-none font-black text-[9px] uppercase px-3">{exp.period}</Badge>
                                        <h4 className="text-xl font-black uppercase italic">{exp.title}</h4>
                                        <p className="text-primary text-[10px] font-black uppercase tracking-widest">{exp.org}</p>
                                        <p className="text-sm text-muted-foreground italic mt-3 leading-relaxed">"{exp.desc}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* LANGUAGES & CERTIFICATIONS */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 rounded-[3rem] p-12 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
                                <Languages size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic">Compétences Linguistiques</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>Français</span><span className="text-primary">Très Bien</span></div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary w-[95%]" /></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>Swahili</span><span className="text-primary">Très Bien</span></div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary w-[90%]" /></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>Lingala</span><span className="text-primary">Moyen</span></div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary w-[60%]" /></div>
                            </div>
                        </div>
                    </Card>

                    <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic">Formations Spécialisées</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: "Sensibilisation COVID-19", org: "Samaritan's Purse", icon: <CheckCircle2 size={12}/> },
                                { title: "Sensibilisation Média", org: "RTVL Bunia (Stephan)", icon: <CheckCircle2 size={12}/> },
                                { title: "Leadership & Éthique", org: "Asbl AJCDH", icon: <CheckCircle2 size={12}/> }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-accent/30 transition-all">
                                    <div className="text-accent opacity-40 group-hover:opacity-100 transition-opacity">{f.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-white">{f.title}</p>
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">{f.org}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* INSTITUTIONAL CLOSING */}
                <section className="text-center pt-20">
                    <Logo size="lg" className="justify-center mb-10 opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
                        Bahati Nyeke David • Certifié le 19/01/2023 • Bunia, RDC
                    </p>
                </section>
            </main>
        </div>
    );
}
