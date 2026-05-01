
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
  PanelLeft
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
    getTotalRevenue,
    getTodayStats,
    getTotalSales,
    getTotalProducts,
    getLowStockItems,
    getRecentSales
} from '@/lib/data';
import { Product, Sale } from '@/lib/types';

// Définition des liens de navigation
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

export default function DashboardAdminPage() {
  const pathname = usePathname();

  // États pour stocker les données dynamiques
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<{ cdf: number; usd: number }>({ cdf: 0, usd: 0 });
  const [todayStats, setTodayStats] = useState<{ revenue: number; sales: number }>({ revenue: 0, sales: 0 });
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [rate, revenue, today, sales, products, lowStock, recent] = await Promise.all([
                getExchangeRate(),
                getTotalRevenue(),
                getTodayStats(),
                getTotalSales(),
                getTotalProducts(),
                getLowStockItems(),
                getRecentSales()
            ]);
            setExchangeRate(rate);
            setTotalRevenue(revenue);
            setTodayStats(today);
            setTotalSales(sales);
            setTotalProducts(products);
            setLowStockItems(lowStock);
            setRecentSales(recent);
        } catch (error) {
            console.error("Erreur lors de la récupération des données du tableau de bord:", error);
        }
        setLoading(false);
    }

    fetchData();
  }, []);

  // Fonctions de formatage
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
         <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                 {mainNavLinks.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-2.5 ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mr-auto"
          >
             <span className="text-white font-black text-sm italic uppercase">DKS</span>
        </Link>

         <nav className="hidden sm:flex items-center space-x-2 bg-card/80 backdrop-blur-sm border-white/10 rounded-xl p-2">
            {mainNavLinks.map((link) => (
              <Link key={link.href} href={link.href} passHref>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className="flex-shrink-0 h-10 w-10 rounded-lg aspect-square"
                  aria-label={link.label}
                >
                  <link.icon className="h-5 w-5" />
                </Button>
              </Link>
            ))}
        </nav>

      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="bg-card border-none shadow-sm rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-6 w-6 text-accent" />
              <p className="text-lg">
                Taux de change : <span className="font-bold">1 USD = {formatCurrency(exchangeRate)} CDF</span>
              </p>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="link" className="text-accent">Modifiable</Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {/* Cartes de statistiques mises à jour */}
             <Card className="bg-card border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">REVENUS TOTAUX</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue.cdf)} CDF</div>
                <p className="text-xs text-muted-foreground">≈ {formatCurrency(totalRevenue.usd)} $</p>
              </CardContent>
            </Card>
             <Card className="bg-card border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">AUJOURD'HUI</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayStats.revenue)} CDF</div>
                <p className="text-xs text-muted-foreground">{todayStats.sales} vente(s)</p>
              </CardContent>
            </Card>
            {/* ... autres cartes ... */}
             <Card className="bg-card border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">VENTES TOTALES</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
              </CardContent>
            </Card>
             <Card className="bg-card border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">PRODUITS</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {lowStockItems.length > 0 && (
                <div className="xl:col-span-2">
                   <Card className="bg-card border-none shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-4">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            <CardTitle className="text-destructive">Alerte stock faible</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {lowStockItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1 text-sm text-destructive-foreground border border-destructive/20">
                                        <span>{item.name}</span>
                                        <Badge variant="destructive">{item.stock}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="lg:col-span-1 xl:col-span-1">
                <Card className="bg-card border-none shadow-sm h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ventes récentes</CardTitle>
                     <Button variant="ghost" size="icon" onClick={() => { /* Logique de rafraîchissement */ }} >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Caissier</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                                <div className="font-medium">{sale.cashierName}</div>
                                <div className="text-xs text-muted-foreground">#{sale.id.substring(0, 4)}</div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(sale.totalAmount)} CDF</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </div>
          </div>
        </main>
    </div>
  );
}
