"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X as CloseIcon, 
    Send, 
    Sparkles, 
    Loader2, 
    RotateCcw, 
    ChevronDown, 
    Mic, 
    MicOff, 
    Volume2, 
    VolumeX, 
    Languages,
    Globe as GlobeIcon,
    Check,
    Camera,
    Image as ImageIcon,
    MapPin,
    Cpu,
    QrCode,
    Maximize,
    Zap,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { askAssistant } from '@/ai/flows/customer-assistant';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    'fr': "Bonjour ! Je suis l'Expert Double King. Je peux identifier votre matériel par photo, répondre à vos questions sur le stock ou scanner un QR Code produit.",
    'en': "Hello! I am the Double King Expert. I can identify your hardware by photo, answer questions about stock or scan a product QR Code.",
    'sw': "Habari! Mimi ni Mtaalamu wa Double King. Naweza kutambua kifaa chako kwa picha, kujibu maswali kuhusu bidhaa au kusoma QR Code.",
    'ln': "Mbote! Nazali Expert ya Double King. Nakoki koyeba matériel na photo, koyanola mituna na yo to mpe kotala QR Code ya eloko."
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
    const [isListening, setIsListening] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognitionConstructor && typeof SpeechRecognitionConstructor === 'function') {
                try {
                    recognitionRef.current = new SpeechRecognitionConstructor();
                    recognitionRef.current.continuous = false;
                    recognitionRef.current.interimResults = false;
                    recognitionRef.current.lang = currentLanguage.voiceCode;
                    recognitionRef.current.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        setInput(transcript);
                        setIsListening(false);
                    };
                    recognitionRef.current.onend = () => setIsListening(false);
                } catch (e) {
                    console.warn("SpeechRecognition init failed");
                }
            }
        }
    }, [currentLanguage]);

    const speak = (text: string) => {
        if (!isSpeechEnabled || typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SynthesisUtterance(text);
        utterance.lang = currentLanguage.voiceCode;
        window.speechSynthesis.speak(utterance);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAttachedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        let showTimer: any;
        let hideTimer: any;

        if (!isOpen) {
            showTimer = setTimeout(() => {
                setShowTeaser(true);
                hideTimer = setTimeout(() => {
                    setShowTeaser(false);
                }, 8000);
            }, 5000);
        } else {
            setShowTeaser(false);
        }

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async (overrideInput?: string) => {
        const messageToSend = overrideInput || input || (attachedImage ? "Analyse de photo" : "");
        if (!messageToSend.trim() && !attachedImage) return;
        if (isLoading) return;

        const userMsg = messageToSend.trim();
        const userImg = attachedImage;
        setInput("");
        setAttachedImage(null);
        setShowTeaser(false);
        
        const currentMsgs: Message[] = [...messages, { role: 'user', text: userMsg, image: userImg || undefined }];
        setMessages(currentMsgs);
        setIsLoading(true);

        try {
            // Formatage propre de l'historique pour Genkit 1.x
            const historyForAi = currentMsgs.slice(0, -1).map(m => ({ 
                role: m.role, 
                content: [{ text: m.text }] 
            }));

            const response = await askAssistant({ 
                message: userMsg, 
                language: currentLanguage.code, 
                photoDataUri: userImg || undefined, 
                history: historyForAi 
            });

            setMessages(prev => [...prev, { role: 'model', text: response }]);
            if (isSpeechEnabled) speak(response);
        } catch (error) {
            console.error("AI Send Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler ?" }]);
        } finally { 
            setIsLoading(false); 
        }
    };

    const toggleScanner = async () => {
        if (!isScannerOpen) {
            setIsScannerOpen(true);
            setTimeout(async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } catch (e) { toast({ title: "Accès Caméra Refusé", variant: "destructive" }); setIsScannerOpen(false); }
            }, 100);
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            setIsScannerOpen(false);
        }
    };

    const simulateQrScan = () => {
        setIsScannerOpen(false);
        toast({ title: "Code QR Détecté", description: "Analyse en cours..." });
        handleSend("Je viens de scanner un produit, donnez-moi les détails et le stock.");
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {showTeaser && !isOpen && (
                <div onClick={() => { setIsOpen(true); setShowTeaser(false); }} className="bg-accent text-black p-4 rounded-2xl rounded-br-none shadow-2xl cursor-pointer animate-in fade-in slide-in-from-right-4 max-w-[220px] relative group hover:scale-105 transition-transform duration-300">
                    <p className="text-[10px] font-black uppercase italic leading-tight">Besoin d'aide ? Scannez un produit ou posez une question !</p>
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-accent rotate-45" />
                    <button onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }} className="absolute -top-2 -left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloseIcon size={10} />
                    </button>
                </div>
            )}

            {isOpen && (
                <Card className="w-[380px] h-[600px] glossy-card border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 zoom-in-95">
                    <CardHeader className="bg-primary/20 backdrop-blur-3xl p-6 border-b border-white/5 shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent"><Sparkles size={20} className="animate-pulse" /></div>
                                <div><CardTitle className="text-sm font-black uppercase italic">DKS EXPERT</CardTitle><span className="text-[8px] font-black uppercase text-accent tracking-widest">{currentLanguage.label}</span></div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={toggleScanner} className="h-8 w-8 text-white/40 hover:text-accent"><QrCode size={14}/></Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={cn("h-8 w-8 rounded-xl", isSpeechEnabled ? "text-accent bg-accent/10" : "text-white/20")}><Volume2 size={14} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><ChevronDown size={20} /></Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/40" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn("max-w-[85%] p-4 rounded-2xl text-sm shadow-lg", m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white/[0.03] text-white/80 border border-white/5 rounded-tl-none italic")}>
                                    {m.image && <div className="mb-3 rounded-xl overflow-hidden"><img src={m.image} className="w-full h-auto" alt="Attached" /></div>}
                                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="p-4 rounded-2xl bg-white/[0.03] w-fit animate-pulse"><Loader2 className="animate-spin h-4 w-4 text-accent" /></div>}
                    </CardContent>

                    <CardFooter className="p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4">
                        {attachedImage && (
                            <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl animate-in slide-in-from-bottom-2">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-accent/40"><img src={attachedImage} className="w-full h-full object-cover" alt="Thumb" /></div>
                                <span className="text-[8px] font-black uppercase text-accent">Photo prête pour analyse</span>
                                <button onClick={() => setAttachedImage(null)} className="ml-auto p-1 hover:text-red-500"><CloseIcon size={12}/></button>
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full flex gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 transition-all shrink-0"><Camera size={20} /></Button>
                            <Input placeholder="Message..." value={input} onChange={(e) => setInput(e.target.value)} className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent" disabled={isLoading} />
                            <Button type="submit" size="icon" disabled={(!input.trim() && !attachedImage) || isLoading} className="h-14 w-14 rounded-2xl bg-accent text-black"><Send size={20} /></Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogContent className="bg-black/90 border-white/10 text-white rounded-[2.5rem] sm:max-w-lg p-0 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent"><QrCode size={20}/></div>
                            <h3 className="font-black uppercase italic">Lecteur Insta-Info</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleScanner}><CloseIcon size={20}/></Button>
                    </div>
                    <div className="aspect-square relative bg-black flex items-center justify-center">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-accent rounded-3xl relative animate-pulse">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                        <Button onClick={simulateQrScan} className="absolute bottom-8 bg-accent text-black font-black uppercase italic rounded-xl px-8 h-12 shadow-2xl">Simuler Détection QR</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Button onClick={() => { setIsOpen(!isOpen); setShowTeaser(false); }} className={cn("h-16 w-16 rounded-[2.2rem] shadow-2xl transition-all duration-500", isOpen ? "bg-background border border-white/10 text-white rotate-90" : "bg-accent text-black hover:scale-110 shadow-[0_0_30px_rgba(56,189,248,0.4)]")}>
                {isOpen ? <CloseIcon size={28} /> : <Sparkles size={28} className="animate-pulse" />}
            </Button>
        </div>
    );
}
