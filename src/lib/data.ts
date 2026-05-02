import { collection, getDocs, query, where, Timestamp, limit, orderBy, getDoc, doc } from "firebase/firestore"; 
import { db } from "./firebase";
import { Product, Sale, AppUser } from "./types";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

/**
 * Récupère le taux de change actuel
 */
export async function getExchangeRate() {
  return 2500; // 1 USD = 2500 CDF
}

/**
 * Calcule les statistiques globales pour le dashboard
 */
export async function getDashboardStats() {
  const salesCol = collection(db, "sales");
  const productsCol = collection(db, "products");
  
  const [salesSnap, productsSnap] = await Promise.all([
    getDocs(salesCol),
    getDocs(productsCol)
  ]);

  const sales = salesSnap.docs.map(d => d.data() as Sale);
  const products = productsSnap.docs.map(d => d.data() as Product);

  const totalRevenueCDF = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
  const totalSalesCount = sales.length;
  const totalProductsCount = products.length;

  // Calcul des revenus du jour
  const today = startOfDay(new Date());
  const todaySales = sales.filter(s => {
    const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
    return date >= today;
  });
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  return {
    totalRevenueCDF,
    totalSalesCount,
    totalProductsCount,
    todayRevenue,
    todaySalesCount: todaySales.length
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
