
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Search, 
    Download, 
    Printer, 
    CheckCircle2, 
    XCircle,
    Send,
    User,
    Calendar,
    ShoppingCart,
    Trash2,
    Zap,
    QrCode,
    ShieldCheck,
    Lock
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

function QuotesManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Create Quote States
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<any | null>(null);
    const [isGeneratingPDF, setIsGeneratingCert] = useState(false);
    const quoteRef = useRef<HTMLDivElement>(null);

    const quotesQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        const role = user.role?.toLowerCase();
        const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
        
        if (isStaff) return query(collection(db, "quotes"), orderBy("createdAt", "desc"));
        return query(collection(db, "quotes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }, [user?.uid, user?.role]);

    const { data: quotes, isLoading } = useCollection(quotesQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const handleDownloadQuote = async (quote: any) => {
        setSelectedOrderForPDF(quote);
        setTimeout(async () => {
            if (!quoteRef.current) return;
            setIsGeneratingCert(true);
            try {
                const canvas = await html2canvas(quoteRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`DEVIS_DKS_${quote.id.substring(0, 8).toUpperCase()}.pdf`);
                toast({ title: "PDF Généré", description: "Le devis a été téléchargé." });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingCert(false);
                setSelectedOrderForPDF(null);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">DEVIS <span className="text-accent">PROFESSIONNELS</span></h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : (
                      quotes?.map(quote => (
                        <Card key={quote.id} className="glossy-card border-none rounded-[2.5rem] p-8 flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase italic tracking-tight">{quote.businessName || quote.customerName}</h3>
                                <p className="text-accent font-black">${quote.total.toFixed(2)}</p>
                            </div>
                            <Button variant="outline" onClick={() => handleDownloadQuote(quote)} className="rounded-xl font-black uppercase italic text-[10px]">
                                Télécharger PDF
                            </Button>
                        </Card>
                      ))
                    )}
                </div>
            </main>

            {/* QUOTE PDF TEMPLATE (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedOrderForPDF && (
                    <div ref={quoteRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SOLUTIONS</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Expertise & Infrastructure</div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">DEVIS PRO</h2>
                                <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Client</h3>
                                <p className="text-xl font-black uppercase italic">{selectedOrderForPDF.businessName}</p>
                            </div>
                        </div>

                        <table className="w-full mb-12">
                            <thead>
                                <tr className="bg-gray-100 text-[10px] font-black uppercase">
                                    <th className="text-left p-4">Désignation</th>
                                    <th className="text-right p-4">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrderForPDF.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-4 font-bold uppercase italic">{item.name}</td>
                                        <td className="p-4 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-100 text-black" />
                            </div>
                            <div className="text-right space-y-4 relative">
                                <div className="absolute top-[-100px] right-0 flex flex-col items-center">
                                    {/* CACHET SÉCURITÉ MIDNIGHT BLUE */}
                                    <div className="w-32 h-32 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-5deg] opacity-95 relative">
                                        <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                            <path id="quoteCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                            <text className="text-[4px] font-black fill-blue-900 uppercase">
                                                <textPath xlinkHref="#quoteCirclePath">
                                                    CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                </textPath>
                                            </text>
                                        </svg>
                                        <p className="text-[6px] font-black text-blue-900 leading-none">DOUBLE KING SHOP</p>
                                        <div className="my-1.5">
                                            <svg viewBox="0 0 200 200" className="w-12 h-12 text-blue-900">
                                                <path d="M65 65V135M65 100L95 65M65 100L95 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M135 65V135M135 100L105 65M135 100L105 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <p className="text-[6px] font-bold text-blue-900 uppercase">OFFICIAL QUOTE</p>
                                        <p className="text-[7px] font-black text-blue-900 uppercase tracking-widest mt-1">BUNIA</p>
                                    </div>
                                    <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[-5deg]">
                                        <svg viewBox="0 0 200 60" className="w-full h-full"><path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                    </div>
                                </div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Solutions Business Hub v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(QuotesManagementPage);
