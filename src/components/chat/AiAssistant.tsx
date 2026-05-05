"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X, 
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
    Globe,
    Check,
    Camera,
    Image as ImageIcon,
    MapPin,
    Cpu
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
    'fr': "Bonjour ! Je suis l'Expert Double King. Je peux identifier votre matériel par photo, répondre à vos questions sur le stock ou les paiements Crypto.",
    'en': "Hello! I am the Double King Expert. I can identify your hardware by photo, answer your questions about stock or Crypto payments.",
    'sw': "Habari! Mimi ni Mtaalamu wa Double King. Naweza kutambua kifaa chako kwa picha, kujibu maswali yako kuhusu bidhaa au malipo ya Crypto.",
    'ln': "Mbote! Nazali Expert ya Double King. Nakoki koyeba matériel na yo na photo, koyanola na mituna na yo mpo na stock to mpe ndenge ya kofuta na Crypto."
};

const PROTOCOLS: Record<string, {t: string, i: any}[]> = {
    'fr': [
        { t: "Identifiez cet objet (photo)", i: <Camera size={12}/> },
        { t: "Modes de paiement ?", i: <Globe size={12}/> },
        { t: "Où est le Hub ?", i: <MapPin size={12}/> }
    ],
    'en': [
        { t: "Identify this (photo)", i: <Camera size={12}/> },
        { t: "Payment methods?", i: <Globe size={12}/> },
        { t: "Where is the Hub?", i: <MapPin size={12}/> }
    ],
    'sw': [
        { t: "Tambua hii (picha)", i: <Camera size={12}/> },
        { t: "Njia za malipo?", i: <Globe size={12}/> },
        { t: "Hub iko wapi?", i: <MapPin size={12}/> }
    ],
    'ln': [
        { t: "Yeba eloko oyo (photo)", i: <Camera size={12}/> },
        { t: "Ndenge ya kofuta?", i: <Globe size={12}/> },
        { t: "Hub ezali wapi?", i: <MapPin size={12}/> }
    ]
};

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
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
    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);

    // Speech Recognition Setup
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = currentLanguage.voiceCode;

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                    setIsListening(false);
                };
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, [currentLanguage]);

    const speak = (text: string) => {
        if (!isSpeechEnabled || typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage.voiceCode;
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast({ title: "Non supporté", description: "Navigateur incompatible avec la voix.", variant: "destructive" });
            return;
        }
        if (isListening) recognitionRef.current.stop();
        else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachedImage(reader.result as string);
            toast({ title: "Photo jointe", description: "L'Expert DKS va analyser l'image." });
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const timer = setTimeout(() => { if (!isOpen) setShowTeaser(true); }, 5000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async (overrideInput?: string) => {
        const messageToSend = overrideInput || input || (attachedImage ? "Analysez cette photo s'il vous plaît." : "");
        if (!messageToSend.trim() && !attachedImage) return;
        if (isLoading) return;

        const userMsg = messageToSend.trim();
        const userImg = attachedImage;
        setInput("");
        setAttachedImage(null);
        setShowTeaser(false);
        
        const newMessages: Message[] = [...messages, { role: 'user', text: userMsg, image: userImg || undefined }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const historyForAi = newMessages
                .slice(0, -1)
                .map(m => ({
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
            console.error("Chat Error:", error);
            const errMsg = "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler ?";
            setMessages(prev => [...prev, { role: 'model', text: errMsg }]);
            if (isSpeechEnabled) speak(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLanguageChange = (lang: typeof LANGUAGES[0]) => {
        setCurrentLanguage(lang);
        setMessages([{ role: 'model', text: INITIAL_MESSAGES[lang.code] }]);
        window.speechSynthesis.cancel();
    };

    const clearChat = () => {
        setMessages([{ role: 'model', text: INITIAL_MESSAGES[currentLanguage.code] }]);
        setAttachedImage(null);
        window.speechSynthesis.cancel();
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            
            {showTeaser && !isOpen && (
                <div 
                    onClick={() => { setIsOpen(true); setShowTeaser(false); }}
                    className="bg-accent text-black p-4 rounded-2xl rounded-br-none shadow-2xl cursor-pointer animate-in slide-in-from-right-4 duration-500 max-w-[220px] relative group"
                >
                    <p className="text-[10px] font-black uppercase italic leading-tight">Expert Vision Activé : Identifiez votre matériel par photo !</p>
                    <button className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}>
                        <X size={10} />
                    </button>
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-accent rotate-45" />
                </div>
            )}

            {isOpen && (
                <Card className="w-[380px] h-[600px] glossy-card border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                    <CardHeader className="bg-primary/20 backdrop-blur-3xl p-6 border-b border-white/5 shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter">EXPERT VISION</CardTitle>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase text-accent tracking-widest">IA Multimodale • {currentLanguage.label}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/40 hover:text-accent">
                                            <Languages size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-card border-white/10 min-w-[140px] rounded-xl p-2" align="end">
                                        {LANGUAGES.map((lang) => (
                                            <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang)} className={cn("text-[10px] font-black uppercase italic gap-3 rounded-lg mb-1 cursor-pointer", currentLanguage.code === lang.code ? "bg-accent/10 text-accent" : "text-white/60 hover:bg-white/5")}>
                                                <span className="text-base">{lang.flag}</span>
                                                <span className="flex-1">{lang.label}</span>
                                                {currentLanguage.code === lang.code && <Check size={12} />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button variant="ghost" size="icon" onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={cn("h-8 w-8 rounded-xl transition-all", isSpeechEnabled ? "text-accent bg-accent/10" : "text-white/20")}>
                                    {isSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 rounded-xl hover:bg-white/5 text-white/20 hover:text-white"><RotateCcw size={14} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-xl hover:bg-white/5"><ChevronDown size={20} /></Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/40" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                                    m.role === 'user' ? "bg-primary text-white rounded-tr-none font-medium" : "bg-white/[0.03] text-white/80 border border-white/5 rounded-tl-none italic"
                                )}>
                                    {m.image && (
                                        <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
                                            <img src={m.image} alt="Sent" className="w-full h-auto" />
                                        </div>
                                    )}
                                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                                </div>
                                <span className="text-[7px] font-black uppercase opacity-20 mt-1.5 px-1 tracking-[0.2em]">{m.role === 'user' ? 'Transmission' : 'Expert Vision DKS'}</span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 animate-pulse">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 rounded-tl-none">
                                    <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" /></div>
                                </div>
                            </div>
                        )}
                        
                        {messages.length === 1 && !isLoading && (
                            <div className="pt-4 space-y-3">
                                <p className="text-[8px] font-black uppercase text-muted-foreground/30 ml-1 tracking-[0.3em]">Protocoles suggérés :</p>
                                <div className="flex flex-col gap-2">
                                    {PROTOCOLS[currentLanguage.code]?.map(s => (
                                        <button key={s.t} onClick={() => { if(s.t.includes("photo")) fileInputRef.current?.click(); else handleSend(s.t); }} className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-left hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-all flex items-center gap-3 group">
                                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">{s.i}</div>
                                            {s.t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-6 bg-black/40 border-t border-white/5 shrink-0 flex flex-col gap-4">
                        {attachedImage && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-accent shadow-2xl animate-in zoom-in-95 self-start">
                                <img src={attachedImage} className="w-full h-full object-cover" alt="Attached" />
                                <button type="button" onClick={() => setAttachedImage(null)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-destructive"><X size={10}/></button>
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full flex gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent transition-all shrink-0">
                                <Camera size={20} />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={toggleListening} className={cn("h-14 w-14 rounded-2xl border-white/10 transition-all shrink-0", isListening ? "bg-red-500 border-red-500 text-white animate-pulse" : "hover:bg-accent/10 hover:text-accent")}>
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </Button>
                            <Input placeholder={isListening ? "Écoute..." : "Poser une question..."} value={input} onChange={(e) => setInput(e.target.value)} className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent text-xs font-medium" disabled={isLoading} />
                            <Button type="submit" size="icon" disabled={(!input.trim() && !attachedImage) || isLoading} className="h-14 w-14 rounded-2xl bg-accent text-black shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                                <Send size={20} />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            <Button onClick={() => { setIsOpen(!isOpen); setShowTeaser(false); }} className={cn("h-16 w-16 rounded-[2.2rem] shadow-2xl transition-all duration-500 relative group", isOpen ? "bg-background border border-white/10 text-white rotate-90" : "bg-accent text-black hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(56,189,248,0.4)]")}>
                {isOpen ? <X size={28} /> : <Sparkles size={28} className="animate-pulse" />}
                {!isOpen && <div className="absolute -inset-1 bg-accent/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
            </Button>
        </div>
    );
}
