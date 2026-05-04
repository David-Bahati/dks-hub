
"use client";

import { useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Trash2, 
    ArrowLeft, 
    Loader2, 
    AlertTriangle, 
    TrendingUp, 
    Zap, 
    Activity,
    CheckCircle2,
    DollarSign,
    BarChart3,
    History,
    Info,
    FlaskConical
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subDays, startOfDay } from 'date-fns';

function WasteReportPage() {
    const logsQuery = useMemoFirebase(() => {
        return query(
            collection(db, "consumptionLogs"), 
            where("type", "==", "usage"),
            orderBy("createdAt", "desc"),
            limit(500)
        );
    }, []);
    const { data: logs, isLoading: loadingLogs } = useCollection(logsQuery);

    const inventoryQuery = useMemoFirebase(() => collection(db, "consumables"), []);
    const { data: items, isLoading: loadingInventory } = useCollection(inventoryQuery);

    const analysis = useMemo(() => {
        if (!logs || !items) return null;

        const now = new Date();
        const sevenDaysAgo = subDays(now, 7);
        const thirtyDaysAgo = subDays(now, 30);

        const analysisData: any[] = [];
        let totalWasteValue = 0;

        items.forEach(item => {
            const itemLogs = logs.filter(l => l.consumableId === item.id);
            
            // Total usage last 30 days
            const usage30d = itemLogs
                .filter(l => (l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt)) >= thirtyDaysAgo)
                .reduce((acc, l) => acc + l.quantity, 0);

            // Total usage last 7 days
            const usage7d = itemLogs
                .filter(l => (l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt)) >= sevenDaysAgo)
                .reduce((acc, l) => acc + l.quantity, 0);

            const avgDaily30d = usage30d / 30;
            const avgDaily7d = usage7d / 7;

            // Waste indicator: if 7d average is 50% higher than 30d average
            const isAbnormal = avgDaily7d > avgDaily30d * 1.5 && usage7d > 0;
            
            // Financial impact: (Actual 7d usage - Expected 7d usage based on 30d avg) * cost
            const excessUsage = Math.max(0, usage7d - (avgDaily30d * 7));
            const wasteCost = excessUsage * (item.unitCost || 0);

            if (isAbnormal) totalWasteValue += wasteCost;

            analysisData.push({
                ...item,
                usage30d,
                usage7d,
                avgDaily30d: avgDaily30d.toFixed(2),
                avgDaily7d: avgDaily7d.toFixed(2),
                isAbnormal,
                wasteCost,
                status: isAbnormal ? 'high' : 'normal'
            });
        });

        return {
            items: analysisData.sort((a, b) => b.wasteCost - a.wasteCost),
            totalWasteValue,
            highRiskCount: analysisData.filter(i => i.isAbnormal).length
        };
    }, [logs, items]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard/maintenance">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Contrôle <span className="text-red-500">Gaspillage</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Analyse des dérives de consommation labo (7j vs 30j)</p>
                        </div>
                    </div>
                </div>

                {loadingLogs || loadingInventory ? (
                    <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                ) : analysis ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4 border-l-4 border-l-red-500">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500"><AlertTriangle size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Surcoût Gaspillage (7j)</p>
                                    <p className="text-4xl font-black text-white italic">${analysis.totalWasteValue.toFixed(2)}</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Activity size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Dérives Détectées</p>
                                    <p className="text-4xl font-black text-white italic">{analysis.highRiskCount}</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle2 size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Articles Sous Contrôle</p>
                                    <p className="text-4xl font-black text-white italic">{analysis.items.length - analysis.highRiskCount}</p>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 ml-4 flex items-center gap-2">
                                <BarChart3 size={14} /> Analyse Comparative par Ressource
                            </h3>
                            
                            {analysis.items.map((item) => (
                                <Card key={item.id} className={cn(
                                    "glossy-card border-none rounded-[2.5rem] overflow-hidden group transition-all",
                                    item.isAbnormal && "bg-red-500/[0.03] border-l-4 border-l-red-500"
                                )}>
                                    <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0",
                                            item.isAbnormal ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-white/5 text-muted-foreground"
                                        )}>
                                            <FlaskConical size={32} />
                                        </div>
                                        
                                        <div className="flex-1 space-y-2 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-4">
                                                <h4 className="text-xl font-black uppercase italic">{item.name}</h4>
                                                {item.isAbnormal ? (
                                                    <Badge className="bg-red-500 text-white border-none uppercase text-[8px] font-black">Consommation Anormale</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-green-500/20 text-green-400 uppercase text-[8px] font-black">Stable</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                <span>Moyenne 30j: {item.avgDaily30d}/jour</span>
                                                <span className={cn(item.isAbnormal && "text-red-400")}>Moyenne 7j: {item.avgDaily7d}/jour</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10 shrink-0">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Impact Financier</p>
                                                <p className={cn("text-2xl font-black italic", item.isAbnormal ? "text-red-500" : "text-white/20")}>
                                                    ${item.wasteCost.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center min-w-[120px]">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Status</p>
                                                {item.isAbnormal ? (
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <TrendingUp size={14} />
                                                        <span className="text-[10px] font-black">+{(parseFloat(item.avgDaily7d) / (parseFloat(item.avgDaily30d) || 1) * 100 - 100).toFixed(0)}%</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-green-500">
                                                        <CheckCircle2 size={14} />
                                                        <span className="text-[10px] font-black">OK</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                    
                                    {item.isAbnormal && (
                                        <div className="bg-red-500/5 px-8 py-3 flex items-center gap-3 border-t border-red-500/10">
                                            <Info size={14} className="text-red-400" />
                                            <p className="text-[10px] font-bold text-red-400/70 italic uppercase">
                                                Conseil : Vérifiez les procédures d'application avec les techniciens. Pic détecté.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                        <Trash2 size={80} strokeWidth={1} />
                        <p className="text-xl font-black uppercase italic tracking-tighter">Pas assez de données pour l'analyse</p>
                        <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Continuez à journaliser vos consommations pour activer l'intelligence de contrôle.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default withAuth(WasteReportPage);
