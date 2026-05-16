"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X as CloseIcon, 
    Send, 
    Sparkles, 
    Loader2, 
    ChevronDown, 
    Volume2, 
    VolumeX, 
    QrCode,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { askAssistant } from '@/ai/flows/customer-assistant';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Message = {
    role: 'user' | 'model';
    text: string;
    image?: string;
};

const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷', voiceCode: 'fr-FR' },
    { code: 'en', label: 'English', flag: '🇺🇸', voiceCode: 'en-US' },
    { code: 'sw', label: 'Swahili', flag: '🇹🇿', voiceCode: 'sw-TZ' },
    { code: 'ln', label: 'Lingala', flag: '🇨🇩', voiceCode: 'ln-CD' },
];

const INITIAL_MESSAGES: Record<string, string> = {
    'fr': "Bonjour ! Je suis l'Expert Double King. Comment puis-je vous aider aujourd'hui ?",
    'en': "Hello! I am the Double King Expert. How can I help you today?",
    'sw': "Habari! Mimi ni Mtaalamu wa Double King. Naweza kukusaidia aje leo?",
    'ln': "Mbote! Nazali Expert ya Double King. Nakoki kosalisa yo nini lelo?"
};

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES[0]);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: INITIAL_MESSAGES['fr'] }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setShowTeaser(true), 5000);
            const hideTimer = setTimeout(() => setShowTeaser(false), 13000);
            return () => { clearTimeout(timer); clearTimeout(hideTimer); };
        } else {
            setShowTeaser(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async () => {
        const userMsg = input.trim();
        const userImg = attachedImage;
        
        if (!userMsg && !userImg) return;
        if (isLoading) return;

        // CRITIQUE : L'historique envoyé doit exclure le message actuel et le message de bienvenue initial
        const conversationHistory = messages
            .filter((m, idx) => {
                // On retire le tout premier message de bienvenue (model) car Gemini veut commencer par 'user'
                if (idx === 0 && m.role === 'model') return false;
                return true;
            })
            .map(m => ({
                role: m.role,
                content: [{ text: m.text }]
            }));

        const userMessage: Message = { 
            role: 'user', 
            text: userMsg || (userImg ? "Analyse cette image." : ""), 
            image: userImg || undefined 
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setAttachedImage(null);
        setIsLoading(true);

        try {
            const response = await askAssistant({ 
                message: userMessage.text, 
                language: currentLanguage.code, 
                photoDataUri: userImg || undefined, 
                history: conversationHistory as any
            });

            setMessages(prev => [...prev, { role: 'model', text: response }]);
            
            if (isSpeechEnabled && typeof window !== 'undefined') {
                const utterance = new SpeechSynthesisUtterance(response);
                utterance.lang = currentLanguage.voiceCode;
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Désolé, j'ai rencontré une difficulté de communication avec le hub." }]);
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAttachedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleScanner = async () => {
        if (!isScannerOpen) {
            setIsScannerOpen(true);
            setTimeout(async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } catch (e) { 
                    toast({ title: "Accès Caméra Refusé", variant: "destructive" }); 
                    setIsScannerOpen(false); 
                }
            }, 100);
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            setIsScannerOpen(false);
        }
    };

    const changeLanguage = (lang: typeof LANGUAGES[0]) => {
        setCurrentLanguage(lang);
        setMessages([{ role: 'model', text: INITIAL_MESSAGES[lang.code] }]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {showTeaser && !isOpen && (
                <div 
                    onClick={() => setIsOpen(true)} 
                    className="bg-accent text-black p-4 rounded-2xl rounded-br-none shadow-2xl cursor-pointer animate-in fade-in slide-in-from-right-4 max-w-[220px] relative group hover:scale-105 transition-transform"
                >
                    <p className="text-[10px] font-black uppercase italic leading-tight">Besoin d'aide ? Scannez un produit ou posez-moi une question !</p>
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-accent rotate-45" />
                </div>
            )}

            {isOpen && (
                <Card className="w-[380px] h-[620px] glossy-card border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 zoom-in-95">
                    <CardHeader className="bg-primary/20 backdrop-blur-3xl p-6 border-b border-white/5 shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter">Assistant Élite</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-[8px] font-black uppercase text-accent tracking-widest flex items-center gap-1 hover:opacity-80">
                                                {currentLanguage.flag} {currentLanguage.label} <ChevronDown size={8} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-card border-white/10 text-white min-w-[120px]">
                                            {LANGUAGES.map(lang => (
                                                <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang)} className="text-[10px] font-black uppercase italic gap-2 focus:bg-accent focus:text-black">
                                                    <span>{lang.flag}</span> {lang.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={toggleScanner} title="Scanner un QR/Produit" className="h-8 w-8 text-white/40 hover:text-accent">
                                    <QrCode size={14}/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={cn("h-8 w-8 rounded-xl", isSpeechEnabled ? "text-accent bg-accent/10" : "text-white/20")}>
                                    {isSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                                    <ChevronDown size={20} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/40" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-2xl text-sm shadow-lg", 
                                    m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white/[0.03] text-white/80 border border-white/5 rounded-tl-none italic"
                                )}>
                                    {m.image && (
                                        <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
                                            <img src={m.image} className="w-full h-auto" alt="Analyse" />
                                        </div>
                                    )}
                                    {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] w-fit animate-pulse">
                                <Loader2 className="animate-spin h-3 w-3 text-accent" />
                                <span className="text-[10px] font-black uppercase text-accent/40 italic">L'expert DKS réfléchit...</span>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4">
                        {attachedImage && (
                            <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-xl border border-accent/20 animate-in slide-in-from-bottom-2 w-full">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-accent/40 shrink-0">
                                    <img src={attachedImage} className="w-full h-full object-cover" alt="Thumb" />
                                </div>
                                <span className="text-[8px] font-black uppercase text-accent">Photo prête pour analyse</span>
                                <button onClick={() => setAttachedImage(null)} className="ml-auto p-1 hover:text-red-500">
                                    <CloseIcon size={12}/>
                                </button>
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full flex gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                onClick={() => fileInputRef.current?.click()} 
                                className="h-12 w-12 rounded-xl border-white/10 hover:bg-accent/10 transition-all shrink-0"
                                disabled={isLoading}
                            >
                                <ImageIcon size={18} />
                            </Button>
                            <Input 
                                placeholder="Posez votre question..." 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                className="h-12 bg-background/50 border-white/10 rounded-xl focus:border-accent text-sm" 
                                disabled={isLoading} 
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={(!input.trim() && !attachedImage) || isLoading} 
                                className="h-12 w-12 rounded-xl bg-accent text-black shadow-lg shadow-accent/20"
                            >
                                <Send size={18} />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogContent className="bg-black/90 border-white/10 text-white rounded-[2.5rem] sm:max-w-lg p-0 overflow-hidden">
                    <div className="aspect-square relative bg-black flex items-center justify-center">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-accent rounded-3xl relative">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Button 
                onClick={() => setIsOpen(!isOpen)} 
                className={cn(
                    "h-16 w-16 rounded-[2.2rem] shadow-2xl transition-all duration-500", 
                    isOpen 
                        ? "bg-background border border-white/10 text-white rotate-90" 
                        : "bg-accent text-black hover:scale-110 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                )}
            >
                {isOpen ? <CloseIcon size={28} /> : <Sparkles size={28} className="animate-pulse" />}
            </Button>
        </div>
    );
}
