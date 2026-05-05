"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Loader2, 
    User, 
    Bot, 
    ArrowRight,
    Cpu,
    Smartphone,
    MapPin,
    RotateCcw,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { askAssistant } from '@/ai/flows/customer-assistant';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'model';
    text: string;
};

const INITIAL_MESSAGE = "Bonjour ! Je suis l'Expert Double King. Comment puis-je vous aider dans votre setup aujourd'hui ? Je connais tout sur notre stock à Bunia et nos options de paiement Crypto (Pi, DKST).";

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: INITIAL_MESSAGE }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Effet pour afficher un petit teaser après 3 secondes au premier chargement
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setShowTeaser(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (overrideInput?: string) => {
        const messageToSend = overrideInput || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMsg = messageToSend.trim();
        setInput("");
        setShowTeaser(false);
        
        const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Filtrer l'historique pour Gemini (doit commencer par user)
            const historyForAi = newMessages
                .filter((_, index) => index > 0 || newMessages[0].role === 'user')
                .slice(0, -1)
                .map(m => ({
                    role: m.role,
                    content: [{ text: m.text }]
                }));

            const response = await askAssistant({ 
                message: userMsg,
                history: historyForAi 
            });

            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler votre question ?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([{ role: 'model', text: INITIAL_MESSAGE }]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            
            {/* Bulles de Teaser */}
            {showTeaser && !isOpen && (
                <div 
                    onClick={() => { setIsOpen(true); setShowTeaser(false); }}
                    className="bg-accent text-black p-4 rounded-2xl rounded-br-none shadow-2xl cursor-pointer animate-in slide-in-from-right-4 fade-in duration-500 max-w-[200px] relative group"
                >
                    <p className="text-[10px] font-black uppercase italic leading-tight">Besoin d'un conseil hardware ?</p>
                    <button className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}>
                        <X size={10} />
                    </button>
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-accent rotate-45" />
                </div>
            )}

            {/* Fenêtre de Chat */}
            {isOpen && (
                <Card className="w-[380px] h-[600px] glossy-card border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                    <CardHeader className="bg-primary/20 backdrop-blur-3xl p-6 border-b border-white/5 shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter">EXPERT DKS</CardTitle>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase text-accent tracking-widest">IA Active • Bunia Hub</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={clearChat} title="Réinitialiser" className="h-8 w-8 rounded-xl hover:bg-white/5 text-white/20 hover:text-white">
                                    <RotateCcw size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-xl hover:bg-white/5">
                                    <ChevronDown size={20} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/40" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                                    m.role === 'user' 
                                        ? "bg-primary text-white rounded-tr-none font-medium" 
                                        : "bg-white/[0.03] text-white/80 border border-white/5 rounded-tl-none italic"
                                )}>
                                    {m.text}
                                </div>
                                <span className="text-[7px] font-black uppercase opacity-20 mt-1.5 px-1 tracking-[0.2em]">
                                    {m.role === 'user' ? 'Transmission Membre' : 'Réponse Expert DKS'}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 animate-pulse">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 rounded-tl-none">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Suggestions rapides stylisées */}
                        {messages.length === 1 && !isLoading && (
                            <div className="pt-4 space-y-3">
                                <p className="text-[8px] font-black uppercase text-muted-foreground/30 ml-1 tracking-[0.3em]">Protocoles suggérés :</p>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { t: "Quels sont les modes de paiement ?", i: <Coins size={12}/> },
                                        { t: "Où se trouve le Hub à Bunia ?", i: <MapPin size={12}/> },
                                        { t: "Quels sont les arrivages RTX ?", i: <Cpu size={12}/> }
                                    ].map(s => (
                                        <button 
                                            key={s.t} 
                                            onClick={() => { handleSend(s.t); }}
                                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-left hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-all flex items-center gap-3 group"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">{s.i}</div>
                                            {s.t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-6 bg-black/40 border-t border-white/5 shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full flex gap-3">
                            <Input 
                                placeholder="Interroger l'Expert..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent text-xs font-medium"
                                disabled={isLoading}
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={!input.trim() || isLoading}
                                className="h-14 w-14 rounded-2xl bg-accent text-black shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send size={20} />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Bouton Principal */}
            <Button 
                onClick={() => { setIsOpen(!isOpen); setShowTeaser(false); }}
                className={cn(
                    "h-16 w-16 rounded-[2rem] shadow-2xl transition-all duration-500 relative group",
                    isOpen 
                        ? "bg-background border border-white/10 text-white rotate-90" 
                        : "bg-accent text-black hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                )}
            >
                {isOpen ? <X size={28} /> : <Sparkles size={28} className="animate-pulse" />}
                {!isOpen && (
                    <div className="absolute -inset-1 bg-accent/20 rounded-[2.2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </Button>
        </div>
    );
}

import { Coins } from 'lucide-react';
