
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    BarChart3, 
    ArrowLeft, 
    Loader2, 
    TrendingUp, 
    TrendingDown,
    DollarSign, 
    Download, 
    FileText, 
    PieChart as PieIcon, 
    Calendar,
    Briefcase,
    GraduationCap,
    ShoppingCart,
    QrCode,
    ShieldCheck,
    CheckCircle2,
    Building2,
    Users,
    Zap,
    Coins,
    BarChartHorizontal
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, where, getDocs, getDoc, doc } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
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

function FinancialReportingPage() {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(2500);
    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch Sales (Hardware)
    const salesQuery = useMemoFirebase(() => query(collection(db, "sales"), orderBy("createdAt", "desc")), []);
    const { data: sales, isLoading: loadingSales } = useCollection(salesQuery);

    // Fetch Bookings (Academy/Services)
    const bookingsQuery = useMemoFirebase(() => query(collection(db, "serviceBookings"), where("status", "==", "completed")), []);
    const { data: bookings, isLoading: loadingBookings } = useCollection(bookingsQuery);

    useEffect(() => {
        const fetchRate = async () => {
            const configSnap = await getDoc(doc(db, "system", "config"));
            if (configSnap.exists()) setExchangeRate(configSnap.data().exchangeRate || 2500);
        };
        fetchRate();
    }, []);

    const financeStats = useMemo(() => {
        if (!sales || !bookings) return null;

        const hardwareTotal = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
        const servicesTotal = bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
        const grandTotal = hardwareTotal + servicesTotal;

        // Breakdown data for Pie Chart
        const pieData = [
            { name: 'Hardware', value: hardwareTotal, fill: 'hsl(var(--primary))' },
            { name: 'Academy', value: servicesTotal, fill: 'hsl(var(--accent))' }
        ];

        // Best Sellers Hardware
        const productUsage: Record<string, number> = {};
        sales.forEach(s => {
            s.items?.forEach((item: any) => {
                productUsage[item.name] = (productUsage[item.name] || 0) + (item.quantity || 1);
            });
        });
        const bestSellers = Object.entries(productUsage)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        // Best Courses
        const coursePopularity: Record<string, number> = {};
        bookings.forEach(b => {
            coursePopularity[b.serviceTitle] = (coursePopularity[b.serviceTitle] || 0) + 1;
        });
        const topCourses = Object.entries(coursePopularity)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { 
            hardwareTotal, 
            servicesTotal, 
            grandTotal, 
            pieData, 
            bestSellers, 
            topCourses 
        };
    }, [sales, bookings]);

    const handleDownloadReport = async () => {
        if (!reportRef.current || !financeStats) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`BILAN_FINANCIER_DKS_${new Date().getFullYear()}_Q${Math.floor(new Date().getMonth() / 3) + 1}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (user?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé à la direction.</div>;
    }

    const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Bilan <span className="text-accent">Financier Hub</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Compilation des flux Hardware & Academy</p>
                        </div>
                    </div>

                    <Button 
                        onClick={handleDownloadReport} 
                        disabled={isGenerating || !financeStats}
                        className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Exporter Rapport PDF</>}
                    </Button>
                </div>

                {loadingSales || loadingBookings ? (
                    <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                ) : financeStats ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-4 border-l-4 border-l-accent">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><DollarSign size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">CA Global Cumulé (USD)</p>
                                    <p className="text-4xl font-black text-white italic">${financeStats.grandTotal.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">≈ {(financeStats.grandTotal * exchangeRate).toLocaleString()} CDF</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Laptop size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Département Hardware</p>
                                    <p className="text-4xl font-black text-white italic">${financeStats.hardwareTotal.toLocaleString()}</p>
                                </div>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"><GraduationCap size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Département Academy</p>
                                    <p className="text-4xl font-black text-white italic">${financeStats.servicesTotal.toLocaleString()}</p>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <Card className="lg:col-span-4 glossy-card border-none rounded-[3rem] p-10 flex flex-col items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 w-full text-left flex items-center gap-2"><PieIcon size={14} className="text-accent" /> Répartition du CA</h4>
                                <div className="h-[300px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={financeStats.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {financeStats.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full space-y-3 mt-6">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Hardware</div>
                                        <span>{((financeStats.hardwareTotal / financeStats.grandTotal) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Academy</div>
                                        <span>{((financeStats.servicesTotal / financeStats.grandTotal) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="lg:col-span-8 glossy-card border-none rounded-[3rem] p-10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-10 flex items-center gap-2"><TrendingUp size={14} className="text-accent" /> Top Performance Produits</h4>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={financeStats.bestSellers} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={120} />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="qty" radius={[0, 8, 8, 0]}>
                                                {financeStats.bestSellers.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                        <BarChartHorizontal size={80} strokeWidth={1} />
                        <p className="text-xl font-black uppercase italic tracking-tighter">Données insuffisantes</p>
                    </div>
                )}
            </main>

            {/* HIDDEN REPORT TEMPLATE FOR PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {financeStats && (
                    <div ref={reportRef} className="bg-white text-black p-20 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-8 border-black pb-12 mb-16">
                            <div className="space-y-6">
                                <Logo size="lg" />
                                <div className="space-y-1">
                                    <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS FINANCE</div>
                                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Hub Bunia • Province de l'Ituri</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">BILAN<br/>GLOBAL</h2>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">Q{Math.floor(new Date().getMonth() / 3) + 1} • {new Date().getFullYear()}</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-10 mb-16">
                            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Volume d'Affaires Consolidé</p>
                                <h3 className="text-5xl font-black uppercase italic leading-none mb-2">${financeStats.grandTotal.toLocaleString()}</h3>
                                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">≈ {(financeStats.grandTotal * exchangeRate).toLocaleString()} CDF</p>
                            </div>
                            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 space-y-8">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ratio Hardware</p>
                                    <p className="text-2xl font-black italic text-gray-800">{((financeStats.hardwareTotal / financeStats.grandTotal) * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ratio Academy</p>
                                    <p className="text-2xl font-black italic text-blue-600">{((financeStats.servicesTotal / financeStats.grandTotal) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <section>
                                <h3 className="text-xl font-black uppercase italic border-b-2 border-black pb-2 mb-6">TOP PERFORMANCE HARDWARE</h3>
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr className="text-[9px] font-black uppercase text-left">
                                            <th className="p-4">Désignation</th>
                                            <th className="p-4 text-right">Unités Vendues</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {financeStats.bestSellers.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="p-4 font-bold uppercase italic">{item.name}</td>
                                                <td className="p-4 text-right font-black">{item.qty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic border-b-2 border-black pb-2 mb-6">DYNAMISME ACADEMY</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    {financeStats.topCourses.map((course, idx) => (
                                        <div key={idx} className="p-6 border-2 border-gray-50 rounded-2xl text-center">
                                            <p className="text-[8px] font-black uppercase text-gray-400 mb-2">{course.name}</p>
                                            <p className="text-2xl font-black italic text-blue-600">{course.count}</p>
                                            <p className="text-[7px] font-bold uppercase text-gray-300">Étudiants</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <footer className="mt-32 pt-10 border-t-2 border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={80} className="opacity-10" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Vérification Blockchain Pi</p>
                                    <p className="text-[8px] font-medium text-gray-400 max-w-[300px] uppercase leading-tight">
                                        Ce document compile les transactions auditées du Hub DKS. <br />
                                        La certification GCV garantit la stabilité des réserves.
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="h-20 w-40 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[10px] uppercase font-black">Cachet Direction</div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-4">Solutions Business Hub v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(FinancialReportingPage);
