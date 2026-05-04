
"use client";

import { useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    BarChart3, 
    ArrowLeft, 
    Loader2, 
    Zap, 
    TrendingUp, 
    Package, 
    FlaskConical,
    Activity,
    AlertCircle
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MaintenanceStatsPage() {
    const logsQuery = useMemoFirebase(() => {
        return query(collection(db, "consumptionLogs"), orderBy("createdAt", "desc"), limit(200));
    }, []);

    const { data: logs, isLoading } = useCollection(logsQuery);

    const stats = useMemo(() => {
        if (!logs) return null;

        // Group by consumable name
        const usageByItem: Record<string, number> = {};
        const usageByCategory: Record<string, number> = {};
        let totalUsageEvents = 0;

        logs.forEach(log => {
            if (log.type === 'usage') {
                usageByItem[log.consumableName] = (usageByItem[log.consumableName] || 0) + log.quantity;
                usageByCategory[log.category || 'Inconnue'] = (usageByCategory[log.category || 'Inconnue'] || 0) + 1;
                totalUsageEvents++;
            }
        });

        const barData = Object.entries(usageByItem)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        const pieData = Object.entries(usageByCategory)
            .map(([name, value]) => ({ name, value }));

        return { barData, pieData, totalUsageEvents };
    }, [logs]);

    const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-start gap-5 mb-12">
                    <Link href="/dashboard/maintenance">
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                            <ArrowLeft size={24} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Analytique <span className="text-accent">Consommables</span></h1>
                        <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Intelligence de consommation & prévision de stock labo</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                ) : stats && stats.barData.length > 0 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Activity size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Interventions avec conso.</p>
                                    <p className="text-4xl font-black text-white italic">{stats.totalUsageEvents}</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Top Ressource</p>
                                    <p className="text-2xl font-black text-white italic uppercase truncate">{stats.barData[0]?.name}</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500"><AlertCircle size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Précision Inventaire</p>
                                    <p className="text-4xl font-black text-white italic">100%</p>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10">
                                <CardHeader className="p-0 mb-10">
                                    <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                                        <BarChart3 className="text-accent" /> Volume d'utilisation
                                    </CardTitle>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Comparaison des 8 articles les plus consommés</p>
                                </CardHeader>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.barData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                            <YAxis hide />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                                {stats.barData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2.5rem] p-10">
                                <CardHeader className="p-0 mb-10">
                                    <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                                        <FlaskConical className="text-primary" /> Mix de Catégories
                                    </CardTitle>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Répartition des flux par type de ressource</p>
                                </CardHeader>
                                <div className="h-[400px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute flex flex-col items-center">
                                        <p className="text-xs font-black uppercase opacity-40">Total</p>
                                        <p className="text-2xl font-black">{stats.totalUsageEvents}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-white/5">
                                <CardTitle className="text-xl font-black uppercase italic">Derniers Flux de Consommation</CardTitle>
                            </CardHeader>
                            <div className="divide-y divide-white/5">
                                {logs?.slice(0, 10).map((log) => (
                                    <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                log.type === 'usage' ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                                            )}>
                                                {log.type === 'usage' ? <Minus size={18}/> : <Plus size={18}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm uppercase">{log.consumableName}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase">{log.createdAt?.toDate?.().toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={cn(
                                                "border-none uppercase text-[10px] font-black",
                                                log.type === 'usage' ? "text-red-400" : "text-green-400"
                                            )}>
                                                {log.type === 'usage' ? '-' : '+'}{log.quantity} UNITÉS
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                        <BarChart3 size={80} strokeWidth={1} />
                        <p className="text-xl font-black uppercase italic tracking-tighter">Aucune donnée d'utilisation</p>
                        <p className="text-xs uppercase font-black tracking-widest leading-relaxed">Consommez des ressources au labo pour voir l'analytique.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default withAuth(MaintenanceStatsPage);
