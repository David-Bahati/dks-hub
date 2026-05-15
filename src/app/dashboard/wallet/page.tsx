
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
    Smartphone,
    Snowflake,
    Trash2
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, setDoc, Timestamp } from 'firebase/firestore';
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
import { format, addMonths, differenceInSeconds, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

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

    // Staking states
    const [stakingAmount, setStakingAmount] = useState("");
    const [selectedStakingOption, setSelectedStakingOption] = useState(STAKING_OPTIONS[3]);
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

    // Queries
    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const allUsersQuery = useMemoFirebase(() => collection(db, "users"), []);
    const { data: allUsers } = useCollection(allUsersQuery);

    // Simplified query for multi-staking to avoid complex index requirements
    const stakesQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "users", user.uid, "stakes"), orderBy("startedAt", "desc"));
    }, [user?.uid]);
    const { data: rawStakes, isLoading: loadingStakes } = useCollection(stakesQuery);

    const activeStakes = useMemo(() => {
        if (!rawStakes) return [];
        return rawStakes.filter(s => s.status === 'active');
    }, [rawStakes]);

    useEffect(() => {
        setIsMounted(true);
        if (user && !user.hasMnemonic) {
            setIsOnboarding(true);
        }
    }, [user]);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, availablePoints: 0, redeemableTokens: 0, progress: 0, totalStakingRewards: 0, gcvUSD: 0, totalTokens: 0, wealthHistory: [] };

        let total = user.points || 0;
        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        let totalRewards = 0;
        if (activeStakes) {
            activeStakes.forEach(stake => {
                const start = stake.startedAt?.toDate ? stake.startedAt.toDate() : new Date(stake.startedAt);
                const hoursStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
                const stakeReward = (stake.amount * (stake.apr || 0.05) * (hoursStaked / 8760));
                totalRewards += stakeReward;
            });
        }

        const totalTokens = (user.tokenBalance || 0) + (user.stakedBalance || 0) + (user.piBalance || 0);
        const gcvUSD = totalTokens * GCV_VALUE;

        let runningTotal = 0;
        const wealthHistory: any[] = [];
        const sortedTx = transactions ? [...transactions].sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)) : [];
        
        if (sortedTx.length === 0) {
            for(let i=0; i<10; i++) {
                const noise = Math.random() * 0.1 - 0.05;
                wealthHistory.push({ name: `H-${10-i}`, wealth: (totalTokens + noise) * GCV_VALUE });
            }
        } else {
            sortedTx.forEach((tx, idx) => {
                const isIncoming = ['mint', 'mining', 'unstaking', 'dividend', 'exchange', 'swap'].includes(tx.type) || (tx.type === 'transfer' && tx.direction === 'received');
                runningTotal += isIncoming ? tx.tokenAmount : -tx.tokenAmount;
                const date = tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd/MM') : `T${idx}`;
                wealthHistory.push({ name: date, wealth: (runningTotal + (Math.random()*0.02 - 0.01)) * GCV_VALUE });
            });
        }

        return { 
            totalPoints: total, availablePoints, redeemableTokens: redeemable, progress, 
            totalStakingRewards: totalRewards, gcvUSD, totalTokens, wealthHistory: wealthHistory.slice(-20) 
        };
    }, [user, transactions, activeStakes]);

    const ASSETS = useMemo(() => {
        return [
            { id: 'dkst', name: 'DKST Utility', balance: user?.tokenBalance || 0, icon: <DKSTIcon size={24} className="text-accent" />, network: 'dks', price: GCV_VALUE, bg: 'bg-accent/10' },
            { id: 'pi', name: 'Pi Network', balance: user?.piBalance || 0, icon: <Globe className="text-yellow-500" size={24} />, network: 'dks', price: GCV_VALUE, bg: 'bg-yellow-500/10' },
            { id: 'usd', name: 'US Dollar', balance: user?.usdBalance || 0, icon: <CircleDollarSign className="text-green-500" size={24} />, network: 'dks', price: 1, bg: 'bg-green-500/10' }
        ];
    }, [user]);

    const filteredAssets = useMemo(() => {
        return ASSETS.filter(asset => asset.network === activeNetwork.id);
    }, [activeNetwork, ASSETS]);

    const filteredRecipients = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => 
            u.id !== user?.uid && 
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
            toast({ title: "Coffre-fort Activé", description: "Votre wallet est désormais sécurisé." });
            setIsOnboarding(false);
        } catch (e) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsCreatingWallet(false);
        }
    };

    const secureAction = (action: () => void) => {
        if (user?.isWalletLocked) {
            toast({ title: "Wallet Verrouillé", description: "Veuillez déverrouiller votre wallet.", variant: "destructive" });
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
                title: newState ? "Wallet Gélé" : "Wallet Déverrouillé",
                description: newState ? "Toutes les opérations sont suspendues." : "Opérations réactivées.",
                variant: newState ? "destructive" : "default"
            });
        } catch (e) {
            toast({ title: "Erreur Sécurité", variant: "destructive" });
        } finally {
            setIsEmergencyLockProcessing(false);
        }
    };

    const handleConvertPoints = async () => {
        if (!user || stats.redeemableTokens <= 0) return;
        setIsProcessingAction(true);
        try {
            const tokensToAdd = stats.redeemableTokens;
            const pointsToConvert = tokensToAdd * POINTS_PER_TOKEN;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(tokensToAdd),
                pointsConverted: increment(pointsToConvert),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'mint',
                tokenAmount: tokensToAdd,
                memo: `Conversion de ${pointsToConvert} points de prestige`,
                createdAt: serverTimestamp()
            });

            setIsPointsSheetOpen(false);
            setIsSuccessDialogOpen(true);
        } catch (e) {
            toast({ title: "Erreur Conversion", variant: "destructive" });
        } finally {
            setIsProcessingAction(false);
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
            await updateDoc(doc(db, "users", selectedRecipient.uid || selectedRecipient.id), { tokenBalance: increment(amt), updatedAt: serverTimestamp() });
            
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'transfer', direction: 'sent',
                tokenAmount: amt, recipientId: selectedRecipient.uid || selectedRecipient.id, recipientName: selectedRecipient.name || selectedRecipient.displayName,
                memo: transferMemo, piTxId, createdAt: serverTimestamp()
            });
            
            await addDoc(collection(db, "tokenTransactions"), {
                userId: selectedRecipient.uid || selectedRecipient.id, userName: selectedRecipient.name || selectedRecipient.displayName, type: 'transfer', direction: 'received',
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
            const startedAt = new Date();
            const unlockAt = addMonths(startedAt, selectedStakingOption.months);

            // 1. Create a new stake record in the subcollection
            await addDoc(collection(db, "users", user.uid, "stakes"), {
                amount: amt,
                durationMonths: selectedStakingOption.months,
                apr: selectedStakingOption.apr,
                startedAt: serverTimestamp(),
                unlockAt: Timestamp.fromDate(unlockAt),
                status: 'active'
            });

            // 2. Update user balances
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amt),
                stakedBalance: increment(amt),
                updatedAt: serverTimestamp()
            });

            // 3. Log transaction
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'staking',
                tokenAmount: amt, memo: `Staking ${selectedStakingOption.label}`,
                createdAt: serverTimestamp()
            });

            toast({ title: "Contrat Activé", description: "Votre dépôt est maintenant sécurisé dans le Vault." });
            setStakingAmount("");
        } catch (e) { 
            console.error(e);
            toast({ title: "Erreur Staking", variant: "destructive" }); 
        } finally { 
            setIsProcessingAction(false); 
        }
    };

    const handleUnstakePosition = async (stake: any) => {
        if (!user || !stake) return;
        const unlockDate = stake.unlockAt?.toDate ? stake.unlockAt.toDate() : new Date(stake.unlockAt);
        if (isAfter(unlockDate, new Date())) return;

        setIsProcessingAction(true);
        try {
            const start = stake.startedAt?.toDate ? stake.startedAt.toDate() : new Date(stake.startedAt);
            const hours = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
            const rewards = (stake.amount * (stake.apr || 0.05) * (hours / 8760));
            const totalToReturn = stake.amount + rewards;

            await updateDoc(doc(db, "users", user.uid, "stakes", stake.id), { status: 'completed', unstakedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", user.uid), { 
                tokenBalance: increment(totalToReturn), 
                stakedBalance: increment(-stake.amount), 
                updatedAt: serverTimestamp() 
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'unstaking',
                tokenAmount: totalToReturn, memo: `Retrait capital + profits (${stake.durationMonths}m)`,
                createdAt: serverTimestamp()
            });

            toast({ title: "Fonds Libérés", description: "Votre capital et vos profits ont été reversés sur votre solde." });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
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

    if (!isMounted) return null;
    const isLocked = !!user?.isWalletLocked;

    const StakeItem = ({ stake }: { stake: any }) => {
        const [timeRemaining, setTimeRemaining] = useState("");
        const unlockDate = stake.unlockAt?.toDate ? stake.unlockAt.toDate() : new Date(stake.unlockAt);
        const isUnlocked = !isAfter(unlockDate, new Date());

        useEffect(() => {
            const update = () => {
                const diff = differenceInSeconds(unlockDate, new Date());
                if (diff <= 0) setTimeRemaining("PRÊT");
                else {
                    const d = Math.floor(diff / 86400);
                    const h = Math.floor((diff % 86400) / 3600);
                    const m = Math.floor((diff % 3600) / 60);
                    const s = diff % 60;
                    setTimeRemaining(`${d}j ${h}h ${m}m ${s}s`);
                }
            };
            const id = setInterval(update, 1000);
            update();
            return () => clearInterval(id);
        }, [unlockDate]);

        const start = stake.startedAt?.toDate ? stake.startedAt.toDate() : new Date(stake.startedAt);
        const hours = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
        const rewards = (stake.amount * (stake.apr || 0.05) * (hours / 8760));

        return (
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4 hover:border-accent/20 transition-all group animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-lg shadow-accent/10"><Timer size={20} /></div>
                        <div>
                            <p className="text-xs font-black uppercase italic text-white">{stake.amount.toFixed(2)} DKST</p>
                            <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Plan {stake.durationMonths} Mois ({(stake.apr * 100).toFixed(1)}%)</p>
                        </div>
                    </div>
                    <Badge className={cn("border-none text-[8px] font-black uppercase px-2", isUnlocked ? "bg-green-500 text-white animate-pulse" : "bg-white/5 text-white/40")}>
                        {isUnlocked ? "Libéré" : "Séquestre"}
                    </Badge>
                </div>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-white/20">Profits Actuels</p>
                        <p className="text-sm font-black text-green-400 italic">+{rewards.toFixed(6)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-white/20">Compte à rebours</p>
                        <p className="text-[10px] font-mono font-bold text-white/60 tracking-widest">{timeRemaining}</p>
                    </div>
                </div>
                {isUnlocked && (
                    <Button onClick={() => secureAction(() => handleUnstakePosition(stake))} className="w-full h-10 bg-accent text-black font-black uppercase italic text-[9px] rounded-xl shadow-lg mt-2">
                        Réclamer Capital + Profits
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-10">
                
                <div className={cn(
                    "mb-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700 relative transition-all",
                    isLocked && "blur-md opacity-50 grayscale pointer-events-none"
                )}>
                    {isLocked && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-[3rem]">
                             <Snowflake size={64} className="text-red-500 animate-pulse mb-4" />
                             <Badge className="bg-red-500 text-white font-black uppercase italic px-6 py-2 shadow-xl">ACTIFS GELÉS</Badge>
                        </div>
                    )}
                    
                    <button onClick={() => setIsNetworkSheetOpen(true)} className="mb-8 bg-white/5 border border-white/10 px-5 py-2 rounded-full flex items-center gap-3 hover:bg-white/10 transition-all group">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", activeNetwork.color)}><div className={activeNetwork.iconColor}>{activeNetwork.icon}</div></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{activeNetwork.name}</span>
                        <ChevronDown size={14} className="text-white/40 group-hover:text-white" />
                    </button>
                    
                    <div className="group relative">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">Fortune Globale (GCV) <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="hover:text-accent transition-colors">{isBalanceVisible ? <Eye size={12}/> : <EyeOff size={12}/>}</button></p>
                        <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none mb-4 drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                            {isMounted && isBalanceVisible ? `$${stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : "••••••"}
                        </h2>
                        <div className="flex items-center justify-center gap-3">
                            <Badge className="bg-accent text-black font-black italic text-[10px]">≈ {isMounted && isBalanceVisible ? stats.totalTokens.toFixed(4) : "••"} Actifs</Badge>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Universal DKS Protocol v4.0</span>
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

                <div className={cn("space-y-6 mb-16 transition-all", isLocked && "blur-md opacity-50 grayscale pointer-events-none")}>
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Réseau : {activeNetwork.name}</h3>
                        <Button onClick={() => setIsImportSheetOpen(true)} variant="ghost" size="sm" className="text-accent font-black uppercase italic text-[10px] gap-2"><Plus size={14}/> Importer Jeton</Button>
                    </div>
                    <Card className="glossy-card border-none rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="divide-y divide-white/5">
                            {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                                <div key={asset.id} onClick={() => { setReceiveAsset(asset.id); setIsReceiveSheetOpen(true); }} className="p-8 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", asset.bg)}>{asset.icon}</div>
                                        <div>
                                            <div className="flex items-center gap-2"><p className="font-black text-base uppercase italic text-white leading-none">{asset.name}</p><Badge className="bg-white/5 text-white/20 border-none text-[7px] font-black px-1.5 uppercase h-4">{asset.network}</Badge></div>
                                            <p className="text-[9px] font-bold text-accent/40 uppercase tracking-widest mt-2 italic">Price: {isMounted ? `$${asset.price.toLocaleString()}` : "..."}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white leading-none">{isMounted && isBalanceVisible ? asset.balance.toFixed(asset.id === 'pi' ? 6 : 2) : "••••"}</p>
                                        <p className="text-[10px] font-bold text-white/20 mt-2 uppercase tracking-tighter">≈ {isMounted && isBalanceVisible ? `$${(asset.balance * asset.price).toLocaleString()}` : "••••"}</p>
                                    </div>
                                </div>
                            )) : <div className="p-20 text-center space-y-4 opacity-30"><Search size={40} className="mx-auto" /><p className="text-[10px] font-black uppercase tracking-widest">Aucun actif sur ce réseau</p></div>}
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-2xl h-14 w-full flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-white data-[state=active]:text-black transition-all">Analyse</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">DKS Vault</TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all">Sécurité</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={120} /></div>
                            <div className="flex justify-between items-center mb-10 relative z-10"><div><h3 className="text-2xl font-black uppercase italic">Analyse <span className="text-accent">Performance</span></h3><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Estimation GCV temps réel</p></div><div className="flex items-center gap-2 text-green-400"><TrendingUp size={20} /><span className="text-sm font-black italic">+8.4% (30j)</span></div></div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.wealthHistory}>
                                        <defs><linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                                        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} itemStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                                        <Area type="monotone" dataKey="wealth" stroke="hsl(var(--accent))" strokeWidth={4} fill="url(#colorW)" />
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
                                    <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/20"><Vault size={28}/></div><div><h3 className="text-2xl font-black uppercase italic tracking-tight">Ouvrir Position</h3><p className="text-[9px] font-bold text-primary uppercase tracking-widest">Contrat de Blocage DKS</p></div></div>
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Période de Staking</Label>
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
                                            <div className="flex justify-between items-end px-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Montant DKST</Label><p className="text-[9px] font-bold text-white/40 uppercase">Max : <span className="text-accent">{(user?.tokenBalance || 0).toFixed(2)}</span></p></div>
                                            <div className="relative"><Input type="number" value={stakingAmount} onChange={(e) => setStakingAmount(e.target.value)} className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-3xl font-black text-white px-8" /><button onClick={() => setStakingAmount((user?.tokenBalance || 0).toString())} className="absolute right-6 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-accent text-black font-black uppercase italic text-[10px]">MAX</button></div>
                                        </div>
                                        <Button onClick={() => secureAction(handleStake)} disabled={isProcessingAction || !stakingAmount} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg gap-3">{isProcessingAction ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24} /> Sceller le Contrat</>}</Button>
                                    </div>
                                </div>
                            </Card>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4">
                                    <h3 className="text-xs font-black uppercase italic text-white/60 flex items-center gap-2"><Timer size={16} /> Mes Contrats Actifs</h3>
                                    <Badge className="bg-white/5 text-muted-foreground border-none text-[8px] font-black uppercase">{activeStakes.length} Positions</Badge>
                                </div>
                                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingStakes ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
                                    ) : activeStakes && activeStakes.length > 0 ? (
                                        activeStakes.map(stake => <StakeItem key={stake.id} stake={stake} />)
                                    ) : (
                                        <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem] opacity-30 italic text-[10px] uppercase font-black">
                                            Aucun contrat de staking actif.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-10">
                                <div className="flex items-center gap-4 text-accent"><ShieldCheck size={32} /><h2 className="text-2xl font-black uppercase italic tracking-tight">Recovery Seed</h2></div>
                                <p className="text-sm text-white/60 italic leading-relaxed">"Votre phrase de récupération de 12 mots est le seul moyen de restaurer vos avoirs en cas de perte de compte."</p>
                                <Button onClick={() => secureAction(() => setIsMnemonicSheetOpen(true))} variant="outline" className="w-full h-16 border-white/10 rounded-2xl font-black uppercase italic text-[11px] hover:bg-accent hover:text-black gap-3"><Eye size={18} /> Afficher ma phrase secrète</Button>
                            </Card>
                            <Card className="bg-red-500/10 border-red-500/20 rounded-[3rem] p-12 space-y-8">
                                <div className="flex items-center gap-4 text-red-500"><ShieldX size={32} /><h3 className="text-2xl font-black uppercase italic tracking-tight">GEL IMMÉDIAT</h3></div>
                                <p className="text-sm text-red-400 font-medium leading-relaxed italic">"Gelez instantanément tous les mouvements de fonds si vous suspectez une intrusion. Seul votre PIN pourra débloquer le wallet."</p>
                                <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} className={cn("w-full h-20 rounded-3xl font-black uppercase italic text-xs gap-3 shadow-2xl transition-all", user?.isWalletLocked ? "bg-white text-black" : "bg-red-500 text-white shadow-red-500/20")}>
                                    {isEmergencyLockProcessing ? <Loader2 className="animate-spin" /> : user?.isWalletLocked ? <><Lock size={20} /> Déverrouiller le Wallet</> : <><ShieldX size={20} /> Verrouiller maintenant</>}
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
                        <div className="flex flex-col items-center text-center gap-6"><div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><ArrowDownLeft size={40} /></div><div><SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Réception DKS</SheetTitle></div></div>
                    </SheetHeader>
                    <div className="p-10 space-y-10 flex flex-col items-center">
                        <div className="bg-white p-8 rounded-[3rem] border-8 border-accent/5"><QrCode size={200} className="text-black" /></div>
                        <div className="w-full space-y-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-2"><p className="text-[8px] font-black uppercase text-muted-foreground">Mon Adresse de Réception</p><p className="text-xs font-mono font-bold break-all text-accent">{getReceiveAddress(receiveAsset)}</p></div>
                            <Button onClick={() => { navigator.clipboard.writeText(getReceiveAddress(receiveAsset)); toast({ title: "Adresse Copiée" }); }} className="w-full h-16 rounded-2xl bg-white text-black font-black">Copier dans le presse-papier</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><Send size={28} /></div><SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Envoi de fonds</SheetTitle></div>
                    </SheetHeader>
                    <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Rechercher un membre</Label>
                            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Nom, email ou ID..." className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl" /></div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredRecipients.map(u => (
                                    <button key={u.id} onClick={() => setSelectedRecipient(u)} className={cn("w-full p-4 rounded-xl border transition-all flex items-center justify-between", (selectedRecipient?.id === u.id || selectedRecipient?.uid === u.id) ? "bg-accent/10 border-accent text-white" : "bg-white/5 border-transparent text-white/60 hover:bg-white/10")}>
                                        <span className="font-bold text-xs uppercase">{u.name || u.displayName}</span>
                                        {(selectedRecipient?.id === u.id || selectedRecipient?.uid === u.id) && <CheckCircle2 size={16} className="text-accent" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Montant à envoyer</Label>
                            <div className="relative"><Input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-white px-8" /><span className="absolute right-6 top-1/2 -translate-y-1/2 text-accent font-black">DKST</span></div>
                        </div>
                        <Button onClick={handleTransfer} disabled={isProcessingAction || !selectedRecipient || !transferAmount} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : "Signer & Envoyer"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* SWAP SHEET */}
            <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><ArrowDownUp size={32} /></div><div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Swap Élite GCV</SheetTitle></div></div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-3xl space-y-4">
                                <Select value={swapFrom} onValueChange={setSwapFrom}><SelectTrigger className="bg-transparent border-none text-white font-black uppercase"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-white/10">{ASSETS.map(a => <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">{a.name}</SelectItem>)}</SelectContent></Select>
                                <Input type="number" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} placeholder="0.00" className="h-16 bg-background/40 border-white/5 rounded-2xl text-2xl font-black text-white" />
                            </div>
                            <div className="flex justify-center"><ArrowDownUp size={24} className="text-accent" /></div>
                            <div className="p-6 bg-accent/5 rounded-3xl space-y-4">
                                <Select value={swapTo} onValueChange={setSwapTo}><SelectTrigger className="bg-transparent border-none text-accent font-black uppercase"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-white/10">{ASSETS.filter(a => a.id !== swapFrom).map(a => <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">{a.name}</SelectItem>)}</SelectContent></Select>
                                <div className="h-16 flex items-center px-4 bg-background/40 rounded-2xl"><p className="text-2xl font-black text-accent">{swapAmount ? (swapFrom === 'usd' ? (parseFloat(swapAmount)/GCV_VALUE).toFixed(8) : swapTo === 'usd' ? (parseFloat(swapAmount)*GCV_VALUE).toFixed(2) : swapAmount) : "0.00"}</p></div>
                            </div>
                        </div>
                        <Button onClick={() => secureAction(handleSwap)} disabled={isProcessingAction || !swapAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl">
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : "Confirmer la conversion"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* POINTS SHEET */}
            <Sheet open={isPointsSheetOpen} onOpenChange={setIsPointsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-primary/10 border-b border-white/5">
                        <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl"><Gift size={28} /></div><SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Prestige Rewards</SheetTitle></div>
                    </SheetHeader>
                    <div className="p-10 space-y-10 flex-1 overflow-y-auto">
                        <div className="text-center space-y-2"><p className="text-[10px] font-black uppercase opacity-40">Points accumulés</p><p className="text-6xl font-black text-white italic">{stats.availablePoints}</p></div>
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                            <p className="text-[10px] font-black uppercase opacity-40">Solde éligible au mint :</p>
                            <p className="text-2xl font-black text-white">{stats.redeemableTokens} <span className="text-xs opacity-40">DKST</span></p>
                            <Button onClick={handleConvertPoints} disabled={isProcessingAction || stats.redeemableTokens <= 0} className="w-full h-14 bg-primary text-white font-black uppercase italic rounded-xl">
                                {isProcessingAction ? <Loader2 className="animate-spin" /> : "Réclamer les Jetons"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* NETWORK SELECTION SHEET */}
            <Sheet open={isNetworkSheetOpen} onOpenChange={setIsNetworkSheetOpen}>
                <SheetContent side="bottom" className="bg-[#1e1e1e] border-none text-white rounded-t-[2.5rem] h-[70vh] flex flex-col p-0">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center"><div className="w-10"></div><SheetTitle className="text-lg font-black uppercase italic text-white">Sélection du Réseau</SheetTitle><button onClick={() => setIsNetworkSheetOpen(false)}><X size={20} /></button></div>
                    <div className="flex-1 overflow-y-auto py-4">
                        {NETWORKS.map((net) => (
                            <button key={net.id} onClick={() => { setActiveNetwork(net); setIsNetworkSheetOpen(false); }} className={cn("w-full px-6 py-5 flex items-center gap-5 transition-all relative", activeNetwork.id === net.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]")}>
                                {activeNetwork.id === net.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-accent border-b-[6px] border-b-transparent" />}
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg", net.color)}><div className={net.iconColor}>{net.icon}</div></div>
                                <div className="text-left"><p className="font-black text-base uppercase italic tracking-tight">{net.name}</p><p className="text-[10px] font-bold text-white/40 uppercase">Connecté au Mainnet</p></div>
                            </button>
                        ))}
                    </div>
                    <div className="p-8 border-t border-white/5"><Button onClick={() => { setIsNetworkSheetOpen(false); setIsAddNetworkSheetOpen(true); }} variant="outline" className="w-full h-14 rounded-full border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase italic gap-2"><Plus size={18} /> Ajouter un Réseau</Button></div>
                </SheetContent>
            </Sheet>

            {/* ADD NETWORK SHEET */}
            <Sheet open={isAddNetworkSheetOpen} onOpenChange={setIsAddNetworkSheetOpen}>
                <SheetContent side="bottom" className="bg-[#f5f5f5] border-none text-black rounded-t-[2.5rem] h-[85vh] flex flex-col p-0">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white"><button onClick={() => { setIsAddNetworkSheetOpen(false); setIsNetworkSheetOpen(true); }}><ArrowLeft size={20} /></button><SheetTitle className="text-lg font-black uppercase italic text-black">Ajouter un Réseau</SheetTitle><button onClick={() => setIsAddNetworkSheetOpen(false)}><X size={20} /></button></div>
                    <div className="bg-white px-6 py-2 flex gap-10 border-b border-gray-100"><button onClick={() => setActiveAddNetworkTab('popular')} className={cn("pb-3 font-black uppercase text-[11px] tracking-widest transition-all", activeAddNetworkTab === 'popular' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400")}>Populaires</button><button onClick={() => setActiveAddNetworkTab('custom')} className={cn("pb-3 font-black uppercase text-[11px] tracking-widest transition-all", activeAddNetworkTab === 'custom' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400")}>Réseau Personnel</button></div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
                        {activeAddNetworkTab === 'popular' ? (
                            <div className="divide-y divide-gray-100">
                                {POPULAR_NETWORKS.map((net) => (
                                    <div key={net.id} className="py-6 flex items-center justify-between group"><div className="flex items-center gap-4"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", net.color)}>{net.icon}</div><p className="font-bold text-sm text-gray-800 uppercase">{net.name}</p></div><Button className="h-10 px-8 bg-[#1e1e1e] text-white rounded-full font-black uppercase italic text-[10px]">Add</Button></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2"><Label className="text-[11px] font-bold text-gray-500 uppercase">Network Name</Label><Input value={newNetworkName} onChange={e => setNewNetworkName(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" /></div>
                                <div className="space-y-2"><Label className="text-[11px] font-bold text-gray-500 uppercase">RPC URL</Label><Input value={newRpcUrl} onChange={e => setNewRpcUrl(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" /></div>
                                <div className="space-y-2"><Label className="text-[11px] font-bold text-gray-500 uppercase">Chain ID</Label><Input value={newChainId} onChange={e => setNewChainId(e.target.value)} className="h-14 bg-white border-gray-200 rounded-2xl text-black font-bold" /></div>
                                <Button className="w-full h-16 rounded-[2rem] bg-black text-white font-black uppercase italic text-lg shadow-2xl mt-8">Ajouter</Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* IMPORT TOKEN SHEET */}
            <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
                <SheetContent side="bottom" className="bg-[#f5f5f5] border-none text-black rounded-t-[2.5rem] h-[85vh] flex flex-col p-0">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white"><div className="w-10"></div><SheetTitle className="text-lg font-black uppercase italic text-black">Importer un Jeton</SheetTitle><button onClick={() => setIsImportSheetOpen(false)}><X size={20} /></button></div>
                    <div className="bg-white px-6 py-2 flex gap-10 border-b border-gray-100"><button onClick={() => setActiveImportTab('search')} className={cn("pb-3 font-black uppercase text-[11px] tracking-widest", activeImportTab === 'search' ? "text-black border-b-4 border-[#2b1b17]" : "text-gray-400")}>Recherche</button><button onClick={() => setActiveImportTab('custom')} className={cn("pb-3 font-black uppercase text-[11px] tracking-widest px-6 py-2 rounded-2xl", activeImportTab === 'custom' ? "text-white bg-[#2b1b17]" : "text-gray-400")}>Jeton Personnel</button></div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                        {activeImportTab === 'search' ? <div className="py-20 text-center opacity-20 uppercase font-black text-[10px]">Recherche de jetons...</div> : (
                            <div className="space-y-8">
                                <div className="space-y-3"><Label className="text-[12px] font-bold text-gray-800">Adresse du contrat de jeton</Label><div className="relative"><Input placeholder="0x..." value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} className="h-16 bg-white border-2 border-gray-100 rounded-2xl text-black font-bold px-6" /><div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3"><button><Copy size={18}/></button><button><Scan size={18}/></button></div></div></div>
                                <div className="space-y-3"><Label className="text-[12px] font-bold text-gray-800">Symbole du jeton</Label><Input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} className="h-16 bg-white border-2 border-gray-100 rounded-2xl text-black font-bold px-6" /></div>
                            </div>
                        )}
                    </div>
                    <div className="p-8 bg-white border-t border-gray-100"><Button className="w-full h-20 rounded-[2.5rem] bg-[#a39f9b] text-white font-black uppercase italic text-lg shadow-2xl">Suivant</Button></div>
                </SheetContent>
            </Sheet>

            {/* PIN VERIFICATION DIALOG */}
            <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5"><div className="flex flex-col items-center gap-6"><div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Lock size={40} /></div><div className="text-center"><DialogTitle className="text-2xl font-black uppercase italic">Signature Élite</DialogTitle></div></div></DialogHeader>
                    <div className="p-10 space-y-8">
                        <div className="space-y-4"><Label className="text-[10px] font-black uppercase text-center block opacity-40">Entrez votre code secret</Label><div className="flex justify-center"><Input type={showPin ? "text" : "password"} maxLength={4} value={enteredPin} onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))} className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" /><button onClick={() => setShowPin(!showPin)}>{showPin ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>
                        <div className="grid grid-cols-2 gap-4"><Button variant="ghost" onClick={() => setIsPinVerificationOpen(false)}>Annuler</Button><Button onClick={handleVerifyPin} disabled={enteredPin.length < 4} className="bg-accent text-black font-black">Valider</Button></div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MNEMONIC SHEET */}
            <Sheet open={isMnemonicSheetOpen} onOpenChange={setIsMnemonicSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5"><SheetTitle className="text-2xl font-black uppercase italic text-accent">Recovery Phrase</SheetTitle></SheetHeader>
                    <div className="p-10 space-y-8">
                        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl"><p className="text-[10px] text-red-400 font-bold uppercase italic">NE JAMAIS partager ces mots. Ils donnent un accès total à vos fonds.</p></div>
                        <div className="grid grid-cols-2 gap-4">{user?.mnemonicWords?.map((word: string, i: number) => (<div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3"><span className="text-[8px] font-black opacity-20">{i+1}</span><span className="text-xs font-bold uppercase">{word}</span></div>))}</div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* SUCCESS DIALOG */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="bg-background border-white/10 text-foreground rounded-[3rem] sm:max-w-md text-center p-12"><div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6"><CheckCircle2 size={40} /></div><h3 className="text-3xl font-black uppercase italic mb-4">Succès !</h3><p className="text-sm text-white/60 mb-8 italic">Vos points ont été convertis en jetons DKST.</p><Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-14 bg-white text-black font-black uppercase italic rounded-2xl">Continuer</Button></DialogContent>
            </Dialog>

        </div>
    );
}

export default withAuth(UniversalWalletPage);
