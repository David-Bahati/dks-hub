import { collection, getDocs, query, where, Timestamp, limit, orderBy, getDoc, doc } from "firebase/firestore"; 
import { db } from "./firebase";
import { Product, Sale, AppUser, Order } from "./types";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

/**
 * Récupère le taux de change actuel depuis Firestore ou une valeur par défaut
 */
export async function getExchangeRate() {
  try {
    const configSnap = await getDoc(doc(db, "system", "config"));
    if (configSnap.exists()) {
      return configSnap.data().exchangeRate || 2500;
    }
    return 2500;
  } catch (error) {
    return 2500;
  }
}

/**
 * Récupère les données d'impact du pool (redistributions légendaires)
 */
export async function getPoolImpactData() {
  try {
    const txCol = collection(db, "tokenTransactions");
    const q = query(txCol, where("type", "==", "mining"), where("rarity", "==", "legendary"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    
    const impactByDay: Record<string, number> = {};
    let totalDistributed = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate ? format(data.createdAt.toDate(), 'dd/MM') : '??';
      // On simule l'impact : chaque bloc légendaire a distribué environ 0.5 DKST au total au pool
      const distributionEstimate = 0.5; 
      impactByDay[date] = (impactByDay[date] || 0) + distributionEstimate;
      totalDistributed += distributionEstimate;
    });

    const chartData = Object.entries(impactByDay).map(([name, total]) => ({ name, total })).reverse();

    return { chartData, totalDistributed };
  } catch (error) {
    console.error("Error fetching pool impact:", error);
    return { chartData: [], totalDistributed: 0 };
  }
}

/**
 * Calcule les statistiques globales pour le dashboard avec répartition par pôle
 */
export async function getDashboardStats() {
  const salesCol = collection(db, "sales");
  const productsCol = collection(db, "products");
  const ordersCol = collection(db, "orders");
  
  const [salesSnap, productsSnap, ordersSnap] = await Promise.all([
    getDocs(salesCol),
    getDocs(productsCol),
    getDocs(query(ordersCol, where("status", "in", ["payée", "payé", "completed", "terminé"])))
  ]);

  const sales = salesSnap.docs.map(d => d.data() as Sale);
  const products = productsSnap.docs.map(d => d.data() as Product);
  const completedOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // Revenus globaux
  const totalRevenueUSD = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
  const totalSalesCount = sales.length;

  // Calcul de la répartition (Ventes vs Services)
  let hardwareRevenue = 0;
  let servicesRevenue = 0;

  completedOrders.forEach(order => {
    if (order.source === 'service_hub' || order.source === 'remote_support') {
      servicesRevenue += (order.total || 0);
    } else {
      hardwareRevenue += (order.total || 0);
    }
  });

  const serviceRatio = totalRevenueUSD > 0 ? servicesRevenue / (servicesRevenue + hardwareRevenue || 1) : 0;
  const finalServicesRevenue = totalRevenueUSD * serviceRatio;
  const finalHardwareRevenue = totalRevenueUSD - finalServicesRevenue;

  // Calcul des revenus du jour
  const today = startOfDay(new Date());
  const todaySales = sales.filter(s => {
    const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
    return date >= today;
  });
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  const rate = await getExchangeRate();

  return {
    totalRevenueUSD,
    totalRevenueCDF: totalRevenueUSD * rate,
    totalSalesCount,
    totalProductsCount: products.length,
    todayRevenue,
    todaySalesCount: todaySales.length,
    breakdown: [
      { name: 'Hardware', value: finalHardwareRevenue, fill: 'hsl(var(--primary))' },
      { name: 'Services & Hub', value: finalServicesRevenue, fill: 'hsl(var(--accent))' }
    ]
  };
}

/**
 * Génère les données pour le graphique de revenus (7 derniers jours)
 */
export async function getRevenueChartData() {
  const salesCol = collection(db, "sales");
  const salesSnap = await getDocs(salesCol);
  const sales = salesSnap.docs.map(d => d.data() as Sale);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return {
      date: format(d, 'dd/MM'),
      fullDate: startOfDay(d),
      revenue: 0
    };
  }).reverse();

  last7Days.forEach(day => {
    const daySales = sales.filter(s => {
      const sDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return isSameDay(sDate, day.fullDate);
    });
    day.revenue = daySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  });

  return last7Days.map(({ date, revenue }) => ({ name: date, total: revenue }));
}

/**
 * Récupère les produits avec un stock faible
 */
export async function getLowStockItems(threshold = 5): Promise<Product[]> {
    const productsCol = collection(db, "products");
    const q = query(productsCol, where("stockQuantity", "<=", threshold));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Product[];
}

/**
 * Récupère les ventes récentes
 */
export async function getRecentSales(count = 5): Promise<(Sale & { cashierName: string })[]> {
    const salesCol = collection(db, "sales");
    const q = query(salesCol, orderBy("createdAt", "desc"), limit(count));
    const salesSnapshot = await getDocs(q);

    const recentSales = await Promise.all(salesSnapshot.docs.map(async (docSnapshot) => {
        const sale = { id: docSnapshot.id, ...docSnapshot.data() } as Sale;
        
        let cashierName = "Système";
        if (sale.userId) {
            const userDoc = await getDoc(doc(db, 'users', sale.userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                cashierName = userData.name || userData.displayName || "Inconnu";
            }
        }

        return {
            ...sale,
            cashierName,
        };
    }));

    return recentSales;
}
