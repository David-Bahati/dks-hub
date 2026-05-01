import { collection, getDocs, query, where, Timestamp, limit, orderBy, getDoc, doc } from "firebase/firestore"; 
import { db } from "./firebase";
import { Product, Sale, User } from "./types";

// TODO: Rendre ce taux dynamique (depuis les paramètres de la base de données)
export async function getExchangeRate() {
  return 2500;
}

// Récupère toutes les ventes
async function getSales(): Promise<Sale[]> {
  const salesCol = collection(db, "sales");
  const salesSnapshot = await getDocs(salesCol);
  const salesList = salesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Sale[];
  return salesList;
}

// Récupère tous les produits
export async function getProducts(): Promise<Product[]> {
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Product[];
    return productsList;
}

// Calcule le revenu total
export async function getTotalRevenue() {
  const sales = await getSales();
  const totalCDF = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const exchangeRate = await getExchangeRate();
  const totalUSD = totalCDF / exchangeRate;

  return {
    cdf: totalCDF,
    usd: totalUSD,
  };
}

// Calcule les revenus d'aujourd'hui
export async function getTodayStats() {
  const salesCol = collection(db, "sales");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const q = query(salesCol, where("createdAt", ">=", todayTimestamp));
  const querySnapshot = await getDocs(q);

  let totalCDF = 0;
  let salesCount = 0;

  querySnapshot.forEach(doc => {
    const sale = doc.data() as Sale;
    totalCDF += sale.totalAmount;
    salesCount++;
  });

  return {
    revenue: totalCDF,
    sales: salesCount,
  };
}

// Récupère le nombre total de ventes
export async function getTotalSales() {
  const sales = await getSales();
  return sales.length;
}

// Récupère le nombre total de produits
export async function getTotalProducts() {
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    return productsSnapshot.size;
}

// Récupère les produits avec un stock faible
export async function getLowStockItems(threshold = 5): Promise<Product[]> {
    const productsCol = collection(db, "products");
    const q = query(productsCol, where("stock", "<=", threshold));
    const querySnapshot = await getDocs(q);
    
    const lowStockList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Product[];

    return lowStockList;
}

// Récupère les ventes récentes avec les noms des caissiers
export async function getRecentSales(count = 5): Promise<(Sale & { cashierName: string })[]> {
    const salesCol = collection(db, "sales");
    const q = query(salesCol, orderBy("createdAt", "desc"), limit(count));
    const salesSnapshot = await getDocs(q);

    const recentSales = await Promise.all(salesSnapshot.docs.map(async (docSnapshot) => {
        const sale = { id: docSnapshot.id, ...docSnapshot.data() } as Sale;
        
        let cashierName = "Utilisateur inconnu";
        if (sale.userId) {
            const userDoc = await getDoc(doc(db, 'users', sale.userId));
            if (userDoc.exists()) {
                cashierName = (userDoc.data() as User).username;
            }
        }

        return {
            ...sale,
            cashierName,
        };
    }));

    return recentSales;
}
