
"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    ArrowRight,
    Loader2, 
    RefreshCw, 
    Send, 
    Globe, 
    Lock, 
    ShieldCheck, 
    History,
    QrCode,
    Zap,
    TrendingUp,
    Vault,
    Timer,
    CircleDollarSign,
    Search, 
    User as UserIcon,
    X,
    ArrowDownLeft,
    ArrowDownUp,
    PlusCircle,
    Database,
    Network,
    Clock,
    Eye,
    EyeOff,
    Fingerprint,
    ShieldAlert,
    ShieldX,
    Info,
    Gift,
    Check,
    Copy,
    ChevronDown,
    Activity,
    Calculator,
    Medal,
    Sparkles,
    Flame,
    Star,
    Key,
    RotateCw,
    Shield,
    CheckCircle2,
    Scan,
    Plus,
    Maximize,
    Coins,
    ChevronRight,
    Smartphone
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, setDoc } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
} from "@/components/ui/sheet";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PI_GCV } from "@/lib/constants";

const GCV_VALUE = 314159; 
const POINTS_PER_TOKEN = 100;

const STAKING_OPTIONS = [
    { months: 3, apr: 0.05, label: "3 MOIS", color: "text-blue-400" },
    { months: 6, apr: 0.085, label: "6 MOIS", color: "text-purple-400" },
    { months: 9, apr: 0.105, label: "9 MOIS", color: "text-orange-400" },
    { months: 12, apr: 0.125, label: "1 AN", color: "text-accent" },
];

const NETWORKS = [
    { id: 'dks', name: 'DKS Sovereign Hub', icon: <Zap size={20}/>, color: 'bg-accent', iconColor: 'text-black' },
    { id: 'eth', name: 'Ethereum Mainnet', icon: <Activity size={20}/>, color: 'bg-blue-500', iconColor: 'text-white' },
    { id: 'bnb', name: 'BNB Smart Chain', icon: <Coins size={20}/>, color: 'bg-yellow-500', iconColor: 'text-black' },
    { id: 'polygon', name: 'Polygon PoS', icon: <Network size={20}/>, color: 'bg-purple-600', iconColor: 'text-white' },
];

const POPULAR_NETWORKS = [
    { id: 'arb', name: 'Arbitrum', icon: <Network size={20} className="text-blue-500" />, color: 'bg-blue-50' },
    { id: 'avax', name: 'Avalanche C-Chain', icon: <Zap size={20} className="text-red-500" />, color: 'bg-red-50' },
    { id: 'opt', name: 'Optimism', icon: <Flame size={20} className="text-red-600" />, color: 'bg-red-100' },
    { id: 'base', name: 'Base', icon: <Globe size={20} className="text-blue-600" />, color: 'bg-blue-100' },
];

const WORDLIST = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident",
    "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
    "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike", "november",
    "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee", "zulu"
];

const DKSTIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
      <path d="M50 5L93.3 30V70L50 95L6.7 70V30L50 5Z" fill="black" stroke="currentColor" strokeWidth="4" />
      <path d="M35 35V65M35 50H55L65 35V65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-20 animate-spin-slow" />
    </svg>
  </div>
);

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [isMounted, setIsMounted] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0]);

    // Modals
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [generatedMnemonic, setGeneratedMnemonic] = useState<string[]>([]);
    const [verificationWords, setVerificationWords] = useState<string[]>([]);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);

    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
    const [isSwapSheetOpen, setIsSwapSheetOpen] = useState(false);
    const [isPointsSheetOpen, setIsPointsSheetOpen] = useState(false);
    const [isNetworkSheetOpen, setIsNetworkSheetOpen] = useState(false);
    const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isMnemonicSheetOpen, setIsMnemonicSheetOpen] = useState(false);
    const [isAddNetworkSheetOpen, setIsAddNetworkSheetOpen] = useState(false);

    // Form states
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [receiveAsset, setReceiveAsset] = useState('dkst');
    const [enteredPin, setEnteredPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Swap states
    const [swapFrom, setSwapFrom] = useState('pi');
    const [swapTo, setSwapTo] = useState('dkst');
    const [swapAmount, setSwapAmount] = useState("");

    const [stakingAmount, setStakingAmount] = useState("");
    const [selectedStakingOption, setSelectedStakingOption] = useState(STAKING_OPTIONS[3]);
    const [stakingMode, setStakingMode] = useState<'stake' | 'unstake'>('stake');

    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);

    // Add Network Specific
    const [activeAddNetworkTab, setActiveAddNetworkTab] = useState<'popular' | 'custom'>('popular');
    const [newNetworkName, setNewNetworkName] = useState("");
    const [newRpcUrl, setNewRpcUrl] = useState("");
    const [newChainId, setNewChainId] = useState("");
    const [newSymbol, setNewSymbol] = useState("");
    const [newExplorerUrl, setNewExplorerUrl] = useState("");

    // Import Token Specific
    const [activeImportTab, setActiveImportTab] = useState<'search' | 'custom'>('custom');
    const [tokenAddress, setTokenAddress] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");
    const [tokenDecimal, setTokenDecimal] = useState("");

    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const allUsersQuery = useMemoFirebase(() => collection(db, "users"), []);
    const { data: allUsers } = useCollection(allUsersQuery);

    useEffect(() => {
        setIsMounted(true);
        if (user && !user.hasMnemonic) {
            setIsOnboarding(true);
        }
    }, [user]);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, availablePoints: 0, redeemableTokens: 0, progress: 0, stakingRewards: 0, gcvUSD: 0, totalTokens: 0, wealthHistory: [] };

        let total = user.points || 0;
        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        let apr = 5;
        if (user.loyaltyLevel === 'Gold') apr = 12;
        else if (user.loyaltyLevel === 'Silver') apr = 8;

        let rewards = 0;
        if (user.stakedBalance && user.stakingStartedAt) {
            const start = user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate() : new Date(user.stakingStartedAt);
            const hoursStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
            rewards = (user.stakedBalance * (apr / 100) * (hoursStaked / 8760));
        }

        const totalTokens = (user.tokenBalance || 0) + (user.stakedBalance || 0) + (user.piBalance || 0);
        const gcvUSD = totalTokens * GCV_VALUE;

        // Curve Dynamique "Trading Pro"
        // On construit l'historique en se basant sur les transactions mais en injectant de la granularité
        let runningTotal = 0;
        const wealthHistory: any[] = [];
        const sortedTx = transactions ? [...transactions].sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)) : [];
        
        if (sortedTx.length === 0) {
            // Mock data si aucune transaction pour ne pas avoir un graphique vide
            for(let i=0; i<10; i++) {
                const noise = Math.random() * 0.1 - 0.05;
                wealthHistory.push({ name: `H-${10-i}`, wealth: (totalTokens + noise) * GCV_VALUE });
            }
        } else {
            sortedTx.forEach((tx, idx) => {
                const isIncoming = ['mint', 'mining', 'unstaking', 'dividend', 'exchange', 'swap'].includes(tx.type) || (tx.type === 'transfer' && tx.direction === 'received');
                runningTotal += isIncoming ? tx.tokenAmount : -tx.tokenAmount;
                const date = tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd/MM') : `T${idx}`;
                
                // On ajoute un point "noise" juste avant pour l'effet trading
                wealthHistory.push({ name: date, wealth: (runningTotal + (Math.random()*0.02 - 0.01)) * GCV_VALUE });
            });
        }

        return { 
            totalPoints: total, availablePoints, redeemableTokens: redeemable, progress, 
            stakingRewards: rewards, gcvUSD, totalTokens, wealthHistory: wealthHistory.slice(-20) 
        };
    }, [user, transactions]);

    const ASSETS = useMemo(() => {
        return [
            { id: 'dkst', name: 'DKST Utility', balance: user?.tokenBalance || 0, icon: <DKSTIcon size={24} className="text-accent" />, network: 'dks', price: GCV_VALUE, bg: 'bg-accent/10' },
            { id: 'pi', name: 'Pi Network', balance: user?.piBalance || 0, icon: <Globe className="text-yellow-500" size={24} />, network: 'dks', price: GCV_VALUE, bg: 'bg-yellow-500/10' },
            { id: 'usd', name: 'US Dollar', balance: user?.usdBalance || 0, icon: <CircleDollarSign className="text-green-500" size={24} />, network: 'dks', price: 1, bg: 'bg-green-500/10' }
        ];
    }, [user]);

    // FILTRAGE DES ACTIFS SELON LE RÉSEAU SÉLECTIONNÉ
    const filteredAssets = useMemo(() => {
        return ASSETS.filter(asset => asset.network === activeNetwork.id);
    }, [activeNetwork, ASSETS]);

    const filteredRecipients = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => 
            u.uid !== user?.uid && 
            (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [allUsers, searchQuery, user?.uid]);

    const generateNewMnemonic = () => {
        const words = [];
        const indices = new Uint32Array(12);
        window.crypto.getRandomValues(indices);
        for (let i = 0; i < 12; i++) {
            words.push(WORDLIST[indices[i] % WORDLIST.length]);
        }
        setGeneratedMnemonic(words);
        setVerificationWords(new Array(12).fill(""));
    };

    const handleOnboardingNext = () => {
        if (onboardingStep === 1) {
            generateNewMnemonic();
            setOnboardingStep(2);
        } else if (onboardingStep === 2) {
            setOnboardingStep(3);
        }
    };

    const handleCreateSecureWallet = async () => {
        const isValid = verificationWords.every((word, i) => word === generatedMnemonic[i]);
        if (!isValid) {
            toast({ title: "Phrase incorrecte", description: "Veuillez vérifier l'ordre des mots.", variant: "destructive" });
            return;
        }

        setIsCreatingWallet(true);
        try {
            await updateDoc(doc(db, "users", user!.uid), {
                hasMnemonic: true,
                mnemonicWords: generatedMnemonic,
                updatedAt: serverTimestamp()
            });
            toast({ title: "Coffre-fort Activé", description: "Votre wallet est désormais sécurisé par une graine cryptographique." });
            setIsOnboarding(false);
        } catch (e) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsCreatingWallet(false);
        }
    };

    const secureAction = (action: () => void) => {
        if (user?.isWalletLocked) {
            toast({ title: "Wallet Verrouillé", variant: "destructive" });
            return;
        }
        if (!user?.walletPin) {
            toast({ title: "PIN non configuré", description: "Veuillez le faire dans les réglages.", variant: "destructive" });
            return;
        }
        setPendingAction(() => action);
        setIsPinVerificationOpen(true);
    };

    const handleVerifyPin = () => {
        if (enteredPin === user?.walletPin) {
            setIsPinVerificationOpen(false);
            const actionToExec = pendingAction;
            setEnteredPin("");
            setPendingAction(null);
            if (actionToExec) actionToExec();
        } else {
            toast({ title: "PIN Incorrect", variant: "destructive" });
            setEnteredPin("");
        }
    };

    const handleTransfer = async () => {
        if (!user || !selectedRecipient || !transferAmount) return;
        const amt = parseFloat(transferAmount);
        if (amt > (user.tokenBalance || 0)) return;

        setIsProcessingAction(true);
        try {
            const piTxId = `PI-SEND-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), { tokenBalance: increment(-amt), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", selectedRecipient.uid), { tokenBalance: increment(amt), updatedAt: serverTimestamp() });
            
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'transfer', direction: 'sent',
                tokenAmount: amt, recipientId: selectedRecipient.uid, recipientName: selectedRecipient.name,
                memo: transferMemo, piTxId, createdAt: serverTimestamp()
            });
            
            await addDoc(collection(db, "tokenTransactions"), {
                userId: selectedRecipient.uid, userName: selectedRecipient.name, type: 'transfer', direction: 'received',
                tokenAmount: amt, senderId: user.uid, senderName: user.name,
                memo: transferMemo, piTxId, createdAt: serverTimestamp()
            });

            toast({ title: "Transfert réussi", description: `${amt} DKST envoyés.` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setSelectedRecipient(null);
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleSwap = async () => {
        const amt = parseFloat(swapAmount);
        if (!user || isNaN(amt) || amt <= 0) return;

        const fromAsset = ASSETS.find(a => a.id === swapFrom);
        const toAsset = ASSETS.find(a => a.id === swapTo);
        
        if (!fromAsset || !toAsset || fromAsset.balance < amt) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            let receivedAmt = amt;
            if (swapFrom === 'usd' && (swapTo === 'dkst' || swapTo === 'pi')) {
                receivedAmt = amt / GCV_VALUE;
            } else if ((swapFrom === 'dkst' || swapFrom === 'pi') && swapTo === 'usd') {
                receivedAmt = amt * GCV_VALUE;
            }

            const updateData: any = { updatedAt: serverTimestamp() };
            updateData[`${swapFrom}Balance`] = increment(-amt);
            if (swapFrom === 'dkst') updateData['tokenBalance'] = increment(-amt);
            
            updateData[`${swapTo}Balance`] = increment(receivedAmt);
            if (swapTo === 'dkst') updateData['tokenBalance'] = increment(receivedAmt);

            await updateDoc(doc(db, "users", user.uid), updateData);

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'swap',
                tokenAmount: receivedAmt,
                fromAsset: swapFrom,
                toAsset: swapTo,
                fromAmount: amt,
                memo: `Swap ${swapFrom.toUpperCase()} vers ${swapTo.toUpperCase()}`,
                createdAt: serverTimestamp()
            });

            toast({ title: "Swap Réussi", description: `${receivedAmt.toFixed(4)} ${swapTo.toUpperCase()} reçus.` });
            setSwapAmount("");
            setIsSwapSheetOpen(false);
        } catch (e) {
            toast({ title: "Erreur Swap", variant: "destructive" });
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleStake = async () => {
        const amt = parseFloat(stakingAmount);
        if (!user || amt <= 0 || amt > (user.tokenBalance || 0)) return;

        setIsProcessingAction(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amt),
                stakedBalance: increment(amt),
                stakingStartedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'staking',
                tokenAmount: amt, memo: `Staking Vault ${selectedStakingOption.label}`,
                createdAt: serverTimestamp()
            });
            toast({ title: "Staking Activé" });
            setStakingAmount("");
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleUnstake = async () => {
        if (!user || (user.stakedBalance || 0) <= 0) return;
        setIsProcessingAction(true);
        try {
            const rewards = stats.stakingRewards;
            const total = user.stakedBalance + rewards;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(total),
                stakedBalance: 0,
                stakingStartedAt: null,
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'unstaking',
                tokenAmount: total, memo: "Unstaking capital + intérêts",
                createdAt: serverTimestamp()
            });
            toast({ title: "Capital débloqué" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleConvertPoints = async () => {
        const amt = stats.redeemableTokens * POINTS_PER_TOKEN;
        if (!user || amt < POINTS_PER_TOKEN) return;

        setIsProcessingAction(true);
        try {
            const tokens = stats.redeemableTokens;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(tokens),
                pointsConverted: increment(amt),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'exchange',
                tokenAmount: tokens, memo: `Conversion de ${amt} points`,
                createdAt: serverTimestamp()
            });
            toast({ title: "Conversion réussie !" });
            setIsPointsSheetOpen(false);
            setIsSuccessDialogOpen(true);
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const toggleEmergencyLock = async () => {
        if (!user) return;
        setIsEmergencyLockProcessing(true);
        try {
            const newState = !user.isWalletLocked;
            await updateDoc(doc(db, "users", user.uid), {
                isWalletLocked: newState,
                updatedAt: serverTimestamp()
            });
            toast({ 
                title: newState ? "Wallet Verrouillé" : "Wallet Déverrouillé", 
                variant: newState ? "destructive" : "default" 
            });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsEmergencyLockProcessing(false); }
    };

    const getReceiveAddress = (asset: string) => {
        if (!user) return "...";
        switch(asset) {
            case 'dkst': return `DKS-WALLET-${user.uid.substring(0, 12).toUpperCase()}`;
            case 'pi': return `G${user.uid.substring(0, 20).toUpperCase()}`;
            case 'usd': return `CD-DKS-BANK-${user.uid.substring(0, 8).toUpperCase()}`;
            default: return user.uid;
        }
    };

    const currentStakingBalance = stakingMode === 'stake' ? (user?.tokenBalance || 0) : (user?.stakedBalance || 0);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-10">
                
                {/* WEALTH HEADER PRO */}
                <div className="mb-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
                    <button 
                        onClick={() => setIsNetworkSheetOpen(true)}
                        className="mb-8 bg-white/5 border border-white/10 px-5 py-2 rounded-full flex items-center gap-3 hover:bg-white/10 transition-all group"
                    >
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", activeNetwork.color)}>
                            <div className={activeNetwork.iconColor}>{activeNetwork.icon}</div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{activeNetwork.name}</span>
                        <ChevronDown size={14} className="text-white/40 group-hover:text-white" />
                    </button>
                    
                    <div className="group relative">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                            Avoirs Totaux (GCV) 
                            <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="hover:text-accent transition-colors">
                                {isBalanceVisible ? <Eye size={12}/> : <EyeOff size={12}/>}
                            </button>
                        </p>
                        <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none mb-4 drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                            {isMounted && isBalanceVisible ? `$${stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : "••••••"}
                        </h2>
                        <div className="flex items-center justify-center gap-3">
                            <Badge className="bg-accent text-black font-black italic text-[10px]">≈ {isMounted && isBalanceVisible ? stats.totalTokens.toFixed(4) : "••"} Actifs</Badge>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Sovereign Protocol v4.0</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-14 w-full max-w-lg">
                        {[
                            { id: 'receive', label: 'Recevoir', icon: ArrowDownLeft, action: () => setIsReceiveSheetOpen(true), bg: 'bg-white/5 border-white/10' },
                            { id: 'send', label: 'Envoyer', icon: Send, action: () => secureAction(() => setIsTransferSheetOpen(true)), bg: 'bg-accent text-black shadow-accent/20 shadow-xl' },
                            { id: 'swap', label: 'Swap', icon: ArrowDownUp, action: () => setIsSwapSheetOpen(true), bg: 'bg-white/5 border-white/10' },
                            { id: 'points', label: 'Points', icon: Gift, action: () => setIsPointsSheetOpen(true), bg: 'bg-white/5 border-white/10' },
                        ].map(btn => (
                            <Button key={btn.id} onClick={btn.action} className={cn("h-16 rounded-[1.5rem] flex flex-col gap-1 font-black uppercase italic text-[9px] transition-all hover:scale-105 active:scale-95", btn.bg)}>
                                <btn.icon size={20} /> {btn.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* ASSET LIST CRYSTAL - FILTRÉE PAR RÉSEAU */}
                <div className="space-y-6 mb-16">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Portefeuille : {activeNetwork.name}</h3>
                        <Button onClick={() => setIsImportSheetOpen(true)} variant="ghost" size="sm" className="text-accent font-black uppercase italic text-[10px] gap-2">
                            <Plus size={14}/> Importer
                        </Button>
                    </div>

                    <Card className="glossy-card border-none rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="divide-y divide-white/5">
                            {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                                <div key={asset.id} onClick={() => { setReceiveAsset(asset.id); setIsReceiveSheetOpen(true); }} className="p-8 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", asset.bg)}>
                                            {asset.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-base uppercase italic text-white leading-none">{asset.name}</p>
                                                <Badge className="bg-white/5 text-white/20 border-none text-[7px] font-black px-1.5 uppercase h-4">{asset.network}</Badge>
                                            </div>
                                            <p className="text-[9px] font-bold text-accent/40 uppercase tracking-widest mt-2 italic">
                                                Price: {isMounted ? `$${asset.price.toLocaleString()}` : "..."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white leading-none">{isMounted && isBalanceVisible ? asset.balance.toFixed(asset.id === 'pi' ? 6 : 2) : "••••"}</p>
                                        <p className="text-[10px] font-bold text-white/20 mt-2 uppercase tracking-tighter">
                                            ≈ {isMounted && isBalanceVisible ? `$${(asset.balance * asset.price).toLocaleString()}` : "••••"}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center space-y-4 opacity-30">
                                    <Search size={40} className="mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun actif sur ce réseau</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* MODULES TABS */}
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-2xl h-14 w-full flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-white data-[state=active]:text-black transition-all">Analyse</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">DKS Vault</TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all">Sécurité</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={120} /></div>
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div><h3 className="text-2xl font-black uppercase italic">Performance <span className="text-accent">Global</span></h3><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Courbe dynamique des avoirs GCV</p></div>
                                <div className="flex items-center gap-2 text-green-400">
                                    <TrendingUp size={20} />
                                    <span className="text-sm font-black italic">+8.4% (30j)</span>
                                </div>
                            </div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.wealthHistory}>
                                        <defs>
                                            <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                                        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="wealth" 
                                            stroke="hsl(var(--accent))" 
                                            strokeWidth={4} 
                                            fill="url(#colorW)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="vault" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><Vault size={120} className="text-primary" /></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/20"><Vault size={28}/></div>
                                        <div><h3 className="text-2xl font-black uppercase italic tracking-tight">Staking Vault</h3><p className="text-[9px] font-bold text-primary uppercase tracking-widest">Rendement Certifié</p></div>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Plan de blocage</Label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {STAKING_OPTIONS.map((opt) => (
                                                    <button key={opt.months} onClick={() => setSelectedStakingOption(opt)} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", selectedStakingOption.months === opt.months ? "bg-primary/20 border-primary text-white" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10")}>
                                                        <span className="text-[10px] font-black">{opt.label}</span>
                                                        <span className={cn("text-[9px] font-bold", opt.color)}>{(opt.apr * 100).toFixed(1)}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Montant</Label>
                                                <p className="text-[9px] font-bold text-white/40 uppercase">Max : <span className="text-accent">{isMounted && isBalanceVisible ? currentStakingBalance.toFixed(2) : "••••"}</span> DKST</p>
                                            </div>
                                            <div className="relative">
                                                <Input type="number" placeholder="0.00" value={stakingAmount} onChange={(e) => setStakingAmount(e.target.value)} className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-3xl font-black text-white px-8" />
                                                <button onClick={() => setStakingAmount(currentStakingBalance.toString())} className="absolute right-6 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-accent text-black font-black uppercase italic text-[10px]">MAX</button>
                                            </div>
                                        </div>

                                        <Button onClick={() => secureAction(handleStake)} disabled={isProcessingAction || !stakingAmount} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg gap-3">
                                            {isProcessingAction ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24} /> Activer Staking</>}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-black/40 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between overflow-hidden relative group">
                                <div className="absolute -bottom-10 -right-10 p-6 opacity-5 group-hover:scale-110 transition-transform"><Timer size={160} className="text-accent" /></div>
                                <div className="space-y-10 relative z-10">
                                    <h3 className="text-xl font-black uppercase italic">Ma Position</h3>
                                    <div className="space-y-8">
                                        <div><p className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-[0.2em]">Capital bloqué</p><p className="text-5xl font-black text-white italic tracking-tighter">{isMounted && isBalanceVisible ? (user?.stakedBalance || 0).toFixed(2) : "••••"} <span className="text-xs not-italic opacity-40">DKST</span></p></div>
                                        <div><p className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-[0.2em]">Intérêts courus</p><p className="text-5xl font-black text-green-400 italic tracking-tighter">+{isMounted && isBalanceVisible ? stats.stakingRewards.toFixed(6) : "••••"}</p></div>
                                    </div>
                                </div>
                                <Button onClick={() => secureAction(handleUnstake)} disabled={isProcessingAction || !user?.stakedBalance} variant="outline" className="mt-12 w-full h-16 border-white/10 rounded-2xl font-black uppercase italic text-[11px] hover:bg-white/5 relative z-10">Unstake All</Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-10">
                                <div className="flex items-center gap-4 text-accent"><ShieldCheck size={32} /><h2 className="text-2xl font-black uppercase italic tracking-tight">Recovery Seed</h2></div>
                                <p className="text-sm text-white/60 italic leading-relaxed">"Perdu vos accès ? Votre phrase de récupération est le seul moyen de restaurer votre wallet."</p>
                                <Button onClick={() => secureAction(() => setIsMnemonicSheetOpen(true))} variant="outline" className="w-full h-16 border-white/10 rounded-2xl font-black uppercase italic text-[11px] hover:bg-accent hover:text-black gap-3">
                                    <Eye size={18} /> Voir ma phrase secrète
                                </Button>
                            </Card>

                            <Card className="bg-red-500/10 border-red-500/20 rounded-[3rem] p-12 space-y-10">
                                <div className="flex items-center gap-4 text-red-500"><ShieldX size={32} /><h3 className="text-2xl font-black uppercase italic tracking-tight">Blocage d'Urgence</h3></div>
                                <p className="text-sm text-red-400 font-medium leading-relaxed italic">"Gelez instantanément tous les mouvements de fonds sur votre wallet en cas de suspicion de fraude."</p>
                                <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} className={cn("w-full h-20 rounded-3xl font-black uppercase italic text-xs gap-3 shadow-2xl transition-all", user?.isWalletLocked ? "bg-white text-black" : "bg-red-500 text-white shadow-red-500/20")}>
                                    {isEmergencyLockProcessing ? <Loader2 className="animate-spin" /> : user?.isWalletLocked ? <><Lock size={20} /> Déverrouiller</> : <><ShieldX size={20} /> Verrouiller Wallet</>}
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* RECEIVE SHEET */}
            <Sheet open={isReceiveSheetOpen} onOpenChange={setIsReceiveSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><ArrowDownLeft size={40} /></div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Recevoir des fonds</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-2">Dépôt sécurisé sur le Hub</p>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="p-10 space-y-10 flex flex-col items-center">
                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-8 border-accent/5">
                            <QrCode size={200} className="text-black" />
                        </div>
                        <div className="w-full space-y-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Votre adresse de réception</p>
                                <p className="text-xs font-mono font-bold break-all text-accent">{getReceiveAddress(receiveAsset)}</p>
                            </div>
                            <Button onClick={() => { navigator.clipboard.writeText(getReceiveAddress(receiveAsset)); toast({ title: "Adresse Copiée" }); }} className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase italic gap-2">
                                <Copy size={18} /> Copier l'adresse
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><Send size={28} /></div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Envoyer des DKST</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Transfert instantané sans frais</p>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Destinataire</Label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Nom, email ou ID..." className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl" />
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredRecipients.map(u => (
                                    <button key={u.uid} onClick={() => setSelectedRecipient(u)} className={cn("w-full p-4 rounded-xl border transition-all flex items-center justify-between", selectedRecipient?.uid === u.uid ? "bg-accent/10 border-accent text-white" : "bg-white/5 border-transparent text-white/60 hover:bg-white/10")}>
                                        <span className="font-bold text-xs uppercase">{u.name}</span>
                                        {selectedRecipient?.uid === u.uid && <CheckCircle2 size={16} className="text-accent" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Montant</Label>
                            <div className="relative">
                                <Input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-white px-8" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-accent font-black">DKST</span>
                            </div>
                        </div>
                        <Button onClick={handleTransfer} disabled={isProcessingAction || !selectedRecipient || !transferAmount} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg">
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : "Confirmer l'envoi"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* SWAP SHEET */}
            <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10">
                                <ArrowDownUp size={32} />
                            </div>
                            <div>
                                <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Swap Élite</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Conversion instantanée GCV</p>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto bg-black/20">
                        <div className="space-y-6">
                            {/* FROM ASSET */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">De (Actif Source)</Label>
                                    <p className="text-[9px] font-bold text-white/40 uppercase">Solde : {isMounted ? ASSETS.find(a => a.id === swapFrom)?.balance.toFixed(4) : "..."}</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <Select value={swapFrom} onValueChange={setSwapFrom}>
                                        <SelectTrigger className="h-10 bg-transparent border-none text-white font-black uppercase italic">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            {ASSETS.map(a => <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={swapAmount} 
                                            onChange={e => setSwapAmount(e.target.value)} 
                                            placeholder="0.00"
                                            className="h-16 bg-background/40 border-white/5 rounded-2xl text-2xl font-black text-white" 
                                        />
                                        <button 
                                            onClick={() => setSwapAmount((ASSETS.find(a => a.id === swapFrom)?.balance || 0).toString())}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-accent/20 text-accent font-black text-[8px]"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center -my-8 relative z-10">
                                <button 
                                    onClick={() => { const temp = swapFrom; setSwapFrom(swapTo); setSwapTo(temp); }}
                                    className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl hover:rotate-180 transition-transform duration-500"
                                >
                                    <ArrowDownUp size={20} />
                                </button>
                            </div>

                            {/* TO ASSET */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">À (Actif Destination)</Label>
                                <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 space-y-4">
                                    <Select value={swapTo} onValueChange={setSwapTo}>
                                        <SelectTrigger className="h-10 bg-transparent border-none text-accent font-black uppercase italic">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            {ASSETS.filter(a => a.id !== swapFrom).map(a => <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="h-16 flex items-center px-4 bg-background/40 rounded-2xl border border-white/5">
                                        <p className="text-2xl font-black text-accent italic">
                                            {isMounted && swapAmount ? (
                                                swapFrom === 'usd' ? (parseFloat(swapAmount) / GCV_VALUE).toFixed(8) :
                                                swapTo === 'usd' ? (parseFloat(swapAmount) * GCV_VALUE).toFixed(2) :
                                                parseFloat(swapAmount).toFixed(4)
                                            ) : "0.00"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                <span className="text-white/40">Taux de Conversion</span>
                                <span className="text-accent">1 {swapFrom.toUpperCase()} = {swapFrom === 'usd' ? (1/GCV_VALUE).toFixed(8) : swapTo === 'usd' ? GCV_VALUE : 1} {swapTo.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                <span className="text-white/40">Frais de Réseau</span>
                                <span className="text-green-400">ZÉRO FRAIS</span>
                            </div>
                        </div>

                        <Button 
                            onClick={() => secureAction(handleSwap)} 
                            disabled={isProcessingAction || !swapAmount || parseFloat(swapAmount) <= 0}
                            className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4 hover:scale-[1.02] transition-all"
                        >
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : <><RefreshCw size={24} /> Lancer le Swap</>}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* POINTS SHEET */}
            <Sheet open={isPointsSheetOpen} onOpenChange={setIsPointsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-primary/10 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl"><Gift size={28} /></div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Prestige Rewards</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Convertissez votre activité en actifs</p>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="p-10 space-y-10 flex-1 overflow-y-auto">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Points accumulés</p>
                            <p className="text-6xl font-black text-white italic tracking-tighter">{isMounted ? stats.availablePoints : "..."}</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span>Conversion Directe</span>
                                <span className="text-primary">{POINTS_PER_TOKEN} PTS = 1 DKST</span>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold italic">Eligible pour conversion :</p>
                                <p className="text-2xl font-black text-white">{isMounted ? stats.redeemableTokens : "..."} <span className="text-xs opacity-40 not-italic uppercase">DKST</span></p>
                            </div>
                            <Button onClick={handleConvertPoints} disabled={isProcessingAction || stats.redeemableTokens <= 0} className="w-full h-14 bg-primary text-white font-black uppercase italic rounded-xl shadow-lg">
                                {isProcessingAction ? <Loader2 className="animate-spin" /> : "Réclamer mes Jetons"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* NETWORK SELECTION SHEET */}
            <Sheet open={isNetworkSheetOpen} onOpenChange={setIsNetworkSheetOpen}>
                <SheetContent side="bottom" className="bg-[#1e1e1e] border-none text-white rounded-t-[2.5rem] h-[70vh] flex flex-col p-0">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="w-10"></div>
                        <SheetTitle className="text-lg font-black uppercase italic tracking-widest text-white">Network selection</SheetTitle>
                        <button onClick={() => setIsNetworkSheetOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="space-y-1">
                            {NETWORKS.map((net) => (
                                <button 
                                    key={net.id} 
                                    onClick={() => { setActiveNetwork(net); setIsNetworkSheetOpen(false); }}
                                    className={cn(
                                        "w-full px-6 py-5 flex items-center gap-5 transition-all relative",
                                        activeNetwork.id === net.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                                    )}
                                >
                                    {activeNetwork.id === net.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-accent border-b-[6px] border-b-transparent" />
                                    )}
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg", net.color)}>
                                        <div className={net.iconColor}>{net.icon}</div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-base uppercase italic tracking-tight">{net.name}</p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Mainnet Connected</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5">
                        <Button 
                            onClick={() => { setIsNetworkSheetOpen(false); setIsAddNetworkSheetOpen(true); }}
                            variant="outline" 
                            className="w-full h-14 rounded-full border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase italic text-sm gap-2"
                        >
                            <Plus size={18} /> Add Network
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ADD NETWORK SHEET */}
            <Sheet open={isAddNetworkSheetOpen} onOpenChange={setIsAddNetworkSheetOpen}>
                <SheetContent side="bottom" className="bg-[#f5f5f5] border-none text-black rounded-t-[2.5rem] h-[85vh] flex flex-col p-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                        <button onClick={() => { setIsAddNetworkSheetOpen(false); setIsNetworkSheetOpen(true); }} className="w-10 h-10 flex items-center justify-center">
                            <ArrowLeft size={20} className="text-black" />
                        </button>
                        <SheetTitle className="text-lg font-black uppercase italic tracking-widest text-black">Add Network</SheetTitle>
                        <button onClick={() => setIsAddNetworkSheetOpen(false)} className="w-10 h-10 flex items-center justify-center">
                            <X size={20} className="text-black" />
                        </button>
                    </div>

                    <div className="bg-white px-6 py-2 flex gap-10 border-b border-gray-100">
                        <button 
                            onClick={() => setActiveAddNetworkTab('popular')}
                            className={cn(
                                "pb-3 font-black uppercase text-[11px] tracking-widest transition-all relative",
                                activeAddNetworkTab === 'popular' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400"
                            )}
                        >
                            Popular
                        </button>
                        <button 
                            onClick={() => setActiveAddNetworkTab('custom')}
                            className={cn(
                                "pb-3 font-black uppercase text-[11px] tracking-widest transition-all relative",
                                activeAddNetworkTab === 'custom' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400"
                            )}
                        >
                            Custom Network
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0 bg-white">
                        {activeAddNetworkTab === 'popular' ? (
                            <div className="divide-y divide-gray-100">
                                {POPULAR_NETWORKS.map((net) => (
                                    <div key={net.id} className="px-6 py-6 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", net.color)}>
                                                {net.icon}
                                            </div>
                                            <p className="font-bold text-sm text-gray-800 uppercase tracking-tight">{net.name}</p>
                                        </div>
                                        <Button className="h-10 px-8 bg-[#1e1e1e] text-white rounded-full font-black uppercase italic text-[10px] hover:bg-black">Add</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Network Name</Label>
                                    <Input value={newNetworkName} onChange={e => setNewNetworkName(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">RPC URL</Label>
                                    <Input value={newRpcUrl} onChange={e => setNewRpcUrl(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Chain ID</Label>
                                    <Input value={newChainId} onChange={e => setNewChainId(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Symbol (Optional)</Label>
                                    <Input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Block Explorer URL (Optional)</Label>
                                    <Input value={newExplorerUrl} onChange={e => setNewExplorerUrl(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" />
                                </div>
                                <Button 
                                    className="w-full h-16 rounded-[2rem] bg-black text-white font-black uppercase italic text-lg shadow-2xl mt-8"
                                    onClick={() => { toast({ title: "Network Processed" }); setIsAddNetworkSheetOpen(false); }}
                                >
                                    Add
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* IMPORT TOKEN SHEET */}
            <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
                <SheetContent side="bottom" className="bg-[#f5f5f5] border-none text-black rounded-t-[2.5rem] h-[85vh] flex flex-col p-0 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="w-10"></div>
                        <SheetTitle className="text-lg font-black uppercase italic tracking-widest text-black">Import Token</SheetTitle>
                        <button onClick={() => setIsImportSheetOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all">
                            <X size={20} className="text-black" />
                        </button>
                    </div>

                    <div className="bg-white px-6 py-2 flex gap-10 border-b border-gray-100">
                        <button 
                            onClick={() => setActiveImportTab('search')}
                            className={cn(
                                "pb-3 font-black uppercase text-[11px] tracking-widest transition-all relative",
                                activeImportTab === 'search' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400"
                            )}
                        >
                            Search
                        </button>
                        <button 
                            onClick={() => setActiveImportTab('custom')}
                            className={cn(
                                "pb-3 font-black uppercase text-[11px] tracking-widest transition-all relative px-6 py-2 rounded-2xl",
                                activeImportTab === 'custom' ? "text-white bg-[#2b1b17] border-none" : "text-gray-400"
                            )}
                        >
                            Custom token
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
                        {activeImportTab === 'search' ? (
                            <div className="space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <Input placeholder="Search tokens..." className="h-14 pl-12 bg-gray-50 border-none rounded-2xl" />
                                </div>
                                <div className="py-10 text-center opacity-20 italic uppercase font-black text-[10px]">Tapez un nom de jeton...</div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[12px] font-bold text-gray-800 tracking-tight ml-1">Token contract address</Label>
                                    <div className="relative group">
                                        <Input 
                                            placeholder="0x..."
                                            value={tokenAddress}
                                            onChange={e => setTokenAddress(e.target.value)}
                                            className="h-16 bg-white border-2 border-gray-100 rounded-2xl text-black font-bold px-6 pr-24 shadow-sm focus:border-accent transition-all" 
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                            <button className="text-gray-400 hover:text-black transition-colors"><Copy size={18}/></button>
                                            <button className="text-gray-400 hover:text-black transition-colors"><Scan size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[12px] font-bold text-gray-800 tracking-tight ml-1">Token symbol</Label>
                                    <Input 
                                        value={tokenSymbol}
                                        onChange={e => setTokenSymbol(e.target.value)}
                                        className="h-16 bg-white border-2 border-gray-100 rounded-2xl text-black font-bold px-6 shadow-sm focus:border-accent transition-all" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[12px] font-bold text-gray-800 tracking-tight ml-1">Token decimal</Label>
                                    <Input 
                                        value={tokenDecimal}
                                        onChange={e => setTokenDecimal(e.target.value)}
                                        className="h-16 bg-white border-2 border-gray-100 rounded-2xl text-black font-bold px-6 shadow-sm focus:border-accent transition-all" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-gray-100">
                        <Button 
                            className="w-full h-20 rounded-[2.5rem] bg-[#a39f9b] text-white font-black uppercase italic text-lg shadow-2xl hover:bg-black transition-all"
                            onClick={() => { toast({ title: "Token Processed" }); setIsImportSheetOpen(false); }}
                        >
                            Next
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ONBOARDING DIALOG */}
            <Dialog open={isOnboarding} onOpenChange={() => { if (user?.hasMnemonic) setIsOnboarding(false); }}>
                <DialogContent className="bg-background border-white/10 text-foreground rounded-[3rem] sm:max-w-xl p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                    <div className="p-10 space-y-10">
                        {onboardingStep === 1 && (
                            <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-accent/20 rounded-[2rem] flex items-center justify-center mx-auto text-accent shadow-xl shadow-accent/10"><Shield size={40} /></div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Sécurisez votre <span className="text-accent">Wallet</span></h3>
                                    <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto italic">"Votre wallet n'est pas encore protégé par une phrase de récupération. C'est le seul moyen de retrouver vos fonds."</p>
                                </div>
                                <Button onClick={handleOnboardingNext} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg">Initialiser mon Coffre-fort</Button>
                            </div>
                        )}
                        {onboardingStep === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><Key size={24} /></div><div><h3 className="text-xl font-black uppercase italic">Ma Phrase Secrète</h3><p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Étape 2/3 : Sauvegarde physique</p></div></div>
                                <div className="grid grid-cols-3 gap-3">
                                    {generatedMnemonic.map((word, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-3 group hover:border-accent/30 transition-all"><span className="text-[8px] font-black text-white/20 uppercase">{i + 1}</span><span className="text-xs font-black text-white uppercase italic tracking-wider">{word}</span></div>
                                    ))}
                                </div>
                                <Button onClick={handleOnboardingNext} className="w-full h-16 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl text-lg">J'ai noté ma phrase</Button>
                            </div>
                        )}
                        {onboardingStep === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><CheckCircle2 size={24} /></div><div><h3 className="text-xl font-black uppercase italic">Vérification de Graine</h3><p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Étape 3/3 : Validation finale</p></div></div>
                                <div className="grid grid-cols-3 gap-3">
                                    {generatedMnemonic.map((_, i) => (
                                        <div key={i} className="relative">
                                            <Input value={verificationWords[i]} onChange={(e) => { const newWords = [...verificationWords]; newWords[i] = e.target.value.toLowerCase().trim(); setVerificationWords(newWords); }} className={cn("h-12 bg-white/5 border-white/10 rounded-xl text-center text-[10px] font-black uppercase italic focus:border-primary transition-all", verificationWords[i] && verificationWords[i] === generatedMnemonic[i] ? "border-green-500/50 bg-green-500/5" : verificationWords[i] ? "border-red-500/50 bg-red-500/5" : "")} />
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={handleCreateSecureWallet} disabled={isCreatingWallet || verificationWords.some((w, i) => w !== generatedMnemonic[i])} className="h-16 w-full bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg">{isCreatingWallet ? <Loader2 className="animate-spin" /> : "Activer mon Elite Vault"}</Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* PIN VERIFICATION DIALOG */}
            <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md overflow-hidden p-0">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex flex-col items-center gap-6"><div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Lock size={40} className="animate-pulse" /></div><div className="text-center"><DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Signature Élite</DialogTitle><DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">Autorisation requise pour transaction</DialogDescription></div></div>
                    </DialogHeader>
                    <div className="p-10 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-center block opacity-40">Entrez votre code secret à 4 chiffres</Label>
                            <div className="flex justify-center gap-4"><div className="relative w-full max-w-[200px]"><Input type={showPin ? "text" : "password"} maxLength={4} value={enteredPin} onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))} className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" autoFocus /><button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors">{showPin ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="ghost" onClick={() => setIsPinVerificationOpen(false)} className="h-14 rounded-2xl font-black uppercase italic text-xs">Annuler</Button>
                            <Button onClick={handleVerifyPin} disabled={enteredPin.length < 4} className="h-14 bg-accent text-black font-black uppercase italic text-xs rounded-2xl shadow-xl shadow-accent/20">Signer & Valider</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MNEMONIC SHEET */}
            <Sheet open={isMnemonicSheetOpen} onOpenChange={setIsMnemonicSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-accent">Recovery Phrase</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Confidentialité Maximale Requise</p>
                    </SheetHeader>
                    <div className="p-10 space-y-8">
                        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                            <p className="text-[10px] text-red-400 font-bold uppercase italic leading-relaxed">NE JAMAIS partager ces mots. Quiconque possède cette phrase possède vos fonds.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {user?.mnemonicWords?.map((word: string, i: number) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                                    <span className="text-[8px] font-black opacity-20">{i+1}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">{word}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* SUCCESS DIALOG */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="bg-background border-white/10 text-foreground rounded-[3rem] sm:max-w-md text-center p-12">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-in zoom-in">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Succès !</h3>
                    <p className="text-sm text-white/60 mb-8 italic">Vos points ont été convertis avec succès au taux officiel du Hub.</p>
                    <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-14 bg-white text-black font-black uppercase italic rounded-2xl">Continuer</Button>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default withAuth(UniversalWalletPage);

    