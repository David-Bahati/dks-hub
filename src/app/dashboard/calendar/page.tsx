
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Calendar as CalendarIcon, 
    Clock, 
    ArrowLeft, 
    Loader2, 
    ChevronLeft, 
    ChevronRight,
    GraduationCap,
    ShieldCheck,
    User,
    MapPin,
    ArrowRight
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { fr } from "date-fns/locale";

function GlobalCalendarPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Fetch Bookings (Academy)
    const bookingsQuery = useMemoFirebase(() => query(collection(db, "serviceBookings")), []);
    const { data: bookings, isLoading: loadingBookings } = useCollection(bookingsQuery);

    // Fetch Audits (Business)
    const auditsQuery = useMemoFirebase(() => query(collection(db, "audits")), []);
    const { data: audits, isLoading: loadingAudits } = useCollection(auditsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const allEvents = useMemo(() => {
        const events: any[] = [];
        
        bookings?.forEach(b => {
            if (b.scheduledDate) {
                events.push({
                    id: b.id,
                    type: 'academy',
                    title: b.serviceTitle,
                    customer: b.customerName,
                    date: new Date(b.scheduledDate),
                    status: b.status,
                    link: '/dashboard/services'
                });
            }
        });

        audits?.forEach(a => {
            if (a.scheduledDate) {
                events.push({
                    id: a.id,
                    type: 'audit',
                    title: `Audit: ${a.businessName}`,
                    customer: a.contactPerson,
                    date: new Date(a.scheduledDate),
                    status: a.status,
                    link: '/dashboard/audits'
                });
            }
        });

        return events;
    }, [bookings, audits]);

    const dayEvents = useMemo(() => {
        if (!selectedDate) return [];
        return allEvents.filter(e => isSameDay(e.date, selectedDate));
    }, [allEvents, selectedDate]);

    if (!isStaff) return <div className="p-20 text-center">Accès réservé.</div>;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Agenda <span className="text-accent">Elite Hub</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Planification des missions & formations</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Calendrier de gauche */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="glossy-card border-none rounded-[3rem] p-8">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={fr}
                                className="rounded-md border-none"
                                classNames={{
                                    day_selected: "bg-accent text-black font-black hover:bg-accent hover:text-black",
                                    day_today: "bg-white/5 text-accent border border-accent/20",
                                }}
                            />
                        </Card>

                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <Clock size={12} /> Légende Agenda
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold uppercase text-white/60">DKS Academy (Cours)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-accent" />
                                    <span className="text-[10px] font-bold uppercase text-white/60">Audit Business (Site)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liste des événements à droite */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="flex justify-between items-end px-4">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">
                                    {selectedDate ? format(selectedDate, "eeee dd MMMM", { locale: fr }) : "Sélectionnez une date"}
                                </h2>
                                <p className="text-[10px] font-black uppercase text-accent tracking-widest mt-1">
                                    {dayEvents.length} Mission(s) programmée(s)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loadingBookings || loadingAudits ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent h-10 w-10" /></div>
                            ) : dayEvents.length > 0 ? (
                                dayEvents.map((event) => (
                                    <Card key={event.id} className="bg-white/5 border-none rounded-[2rem] overflow-hidden group hover:bg-white/[0.08] transition-all">
                                        <CardContent className="p-6 flex items-center gap-6">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                                                event.type === 'academy' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                                            )}>
                                                {event.type === 'academy' ? <GraduationCap size={24} /> : <ShieldCheck size={24} />}
                                            </div>
                                            
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-black uppercase italic text-sm tracking-tight">{event.title}</h4>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <span className="flex items-center gap-1.5"><User size={10} className="text-accent" /> {event.customer}</span>
                                                    <span className="flex items-center gap-1.5"><Badge variant="outline" className="h-4 text-[8px] font-black border-white/10">{event.status}</Badge></span>
                                                </div>
                                            </div>

                                            <Link href={event.link}>
                                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-accent hover:text-black">
                                                    <ArrowRight size={20} />
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center gap-4">
                                    <CalendarIcon size={48} className="text-muted-foreground opacity-20" />
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest italic">Aucune mission pour cette date.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(GlobalCalendarPage);
