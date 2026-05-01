
"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  DollarSign,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
  LineChart,
  Users,
  ReceiptText,
  Tag,
  UsersRound,
  ShoppingBag,
  PanelLeft,
  Loader2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
    getExchangeRate,
    getDashboardStats,
    getLowStockItems,
    getRecentSales
} from '@/lib/data';
import { Product, Sale } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';

const mainNavLinks = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu" },
  { href: "/dashboard/products", icon: Package, label: "Produits" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/dashboard/customers", icon: Users, label: "Clients" },
  { href: "/dashboard/transactions", icon: ReceiptText, label: "Transactions" },
  { href: "/dashboard/promotions", icon: Tag, label: "Promotions" },
  { href: "/dashboard/users", icon: UsersRound, label: "Utilisateurs" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

interface RecentSale extends Sale {
    cashierName: string;
}

function DashboardAdminPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [rate, setRate] = useState(2500);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, lowStockItems, recent, exchangeRate] = await Promise.all([
        getDashboardStats(),
        getLowStockItems(),
        getRecentSales(),
        getExchangeRate()
      ]);
      setStats(dashboardStats);
      setLowStock(lowStockItems);
      setRecentSales(recent);
      setRate(exchangeRate);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
         <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card border-white/10">
              <nav className="grid gap-6 text-lg font-medium mt-10">
                 {mainNavLinks.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-2.5 ${pathname === link.href ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                 ))}
              </nav>
            </SheetContent>
          </Sheet>

        <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:text-base mr-auto"
          >
             <span className="text-white font-black text-sm italic uppercase">DKS</span>
        </Link>

         <nav className="hidden sm:flex items-center space-x-2 bg-card/40 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5">
            {mainNavLinks.slice(0, 5).map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className={`rounded-xl px-4 gap-2 font-bold ${pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Button>
              </Link>
            ))}
        </nav>
      </header>

      <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Tableau de <span className="text-accent">Bord</span></h2>
            <div className="flex items-center space-x-2">
               <Button variant="outline" size="sm" onClick={fetchData} className="border-white/10 bg-white/5 rounded-xl gap-2 font-bold uppercase text-[10px]">
                 <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                 Actualiser
               </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenu Total (CDF)</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{formatCurrency(stats?.totalRevenueCDF || 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">≈ {formatCurrency((stats?.totalRevenueCDF || 0) / rate)} USD</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ventes aujourd'hui</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.todaySalesCount || 0}</div>
                <p className="text-[10px] text-accent mt-1 uppercase font-bold">+{formatCurrency(stats?.todayRevenue || 0)} CDF</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.totalSalesCount || 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Toutes périodes</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catalogue Produits</CardTitle>
                <Package className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.totalProductsCount || 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Articles enregistrés</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 glossy-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-2">
                   <AlertTriangle className="text-destructive" size={20} />
                   Alertes Stocks Faibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStock.length > 0 ? (
                    <div className="space-y-4">
                        {lowStock.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{item.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="destructive" className="font-black">{item.stockQuantity} RESTANTS</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground italic">Aucune alerte de stock pour le moment.</p>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3 glossy-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase italic">Ventes Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    {recentSales.map(sale => (
                        <div key={sale.id} className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xs">
                                {sale.cashierName.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{sale.cashierName}</p>
                                <p className="text-[10px] text-muted-foreground">ID: #{sale.id.substring(0, 6)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm">{formatCurrency(sale.totalAmount)} CDF</p>
                                <p className="text-[10px] text-accent font-bold uppercase">PAYÉ</p>
                            </div>
                        </div>
                    ))}
                    {recentSales.length === 0 && <p className="text-center py-10 text-muted-foreground">Aucune vente enregistrée.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardAdminPage);
