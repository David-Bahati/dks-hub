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
    MapPin
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

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Bonjour ! Je suis l'Expert Double King. Comment puis-je vous aider dans votre setup aujourd'hui ? Je connais tout sur notre stock à Bunia et nos options de paiement Pi Network." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        
        // Ajouter le message de l'utilisateur à l'interface
        const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // CRITIQUE : L'historique pour Gemini doit commencer par 'user'.
            // On filtre le premier message de bienvenue s'il est de type 'model'.
            const historyForAi = newMessages
                .filter((_, index) => index > 0 || newMessages[0].role === 'user')
                .slice(0, -1) // On enlève le dernier message car il est passé dans 'prompt'
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
            setMessages(prev => [...prev, { role: 'model', text: "Une erreur de communication est survenue. Vérifiez votre connexion ou réessayez plus tard." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {/* Fenêtre de Chat */}
            {isOpen && (
                <Card className="w-[380px] h-[550px] glossy-card border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-6 duration-500">
                    <CardHeader className="bg-primary/20 backdrop-blur-3xl p-6 border-b border-white/5 shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter">EXPERT DOUBLE KING</CardTitle>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">En ligne • Bunia</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/5">
                                <X size={18} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/20" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed relative",
                                    m.role === 'user' 
                                        ? "bg-primary text-white rounded-tr-none" 
                                        : "bg-white/5 text-muted-foreground border border-white/5 rounded-tl-none"
                                )}>
                                    {m.text}
                                </div>
                                <span className="text-[8px] font-black uppercase opacity-20 mt-1 px-1 tracking-widest">
                                    {m.role === 'user' ? 'Vous' : 'DKS IA'}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                </div>
                            </div>
                        )}
                        
                        {/* Suggestions rapides */}
                        {messages.length === 1 && !isLoading && (
                            <div className="pt-4 space-y-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Suggestions :</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { t: "Paiement en Pi ?", i: <Cpu size={10}/> },
                                        { t: "Où êtes-vous ?", i: <MapPin size={10}/> },
                                        { t: "Stock RTX ?", i: <Smartphone size={10}/> }
                                    ].map(s => (
                                        <button 
                                            key={s.t} 
                                            onClick={() => { setInput(s.t); }}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold hover:bg-accent/10 hover:text-accent transition-all flex items-center gap-2"
                                        >
                                            {s.i} {s.t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-6 bg-black/20 border-t border-white/5 shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full flex gap-3">
                            <Input 
                                placeholder="Posez votre question..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="h-12 bg-background/50 border-white/10 rounded-xl focus:border-accent text-xs"
                                disabled={isLoading}
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={!input.trim() || isLoading}
                                className="h-12 w-12 rounded-xl bg-accent text-black shadow-accent/20"
                            >
                                <Send size={18} />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Bouton d'ouverture */}
            <Button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 rounded-[2rem] shadow-2xl transition-all duration-500",
                    isOpen 
                        ? "bg-background border border-white/10 text-white rotate-90" 
                        : "bg-accent text-black hover:scale-110 active:scale-95"
                )}
            >
                {isOpen ? <X size={28} /> : <Sparkles size={28} />}
            </Button>
        </div>
    );
}
