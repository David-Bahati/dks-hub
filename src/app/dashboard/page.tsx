
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  TrendingUp, 
  AlertCircle, 
  Wallet, 
  Users,
  PackageSearch
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const data = [
  { name: 'Mon', sales: 4000, profit: 2400 },
  { name: 'Tue', sales: 3000, profit: 1398 },
  { name: 'Wed', sales: 2000, profit: 9800 },
  { name: 'Thu', sales: 2780, profit: 3908 },
  { name: 'Fri', sales: 1890, profit: 4800 },
  { name: 'Sat', sales: 2390, profit: 3800 },
  { name: 'Sun', sales: 3490, profit: 4300 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Overview Dashboard</h1>
          <p className="text-muted-foreground">Monitor your shop's performance and inventory health.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glossy-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Daily Sales</CardTitle>
              <TrendingUp className="text-accent h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,284.50</div>
              <p className="text-xs text-accent">+12.5% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="glossy-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertCircle className="text-destructive h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="glossy-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Wallet className="text-accent h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4,820.00</div>
              <p className="text-xs text-accent">Monthly goal reached 80%</p>
            </CardContent>
          </Card>

          <Card className="glossy-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="text-accent h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">Total unique buyers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glossy-card border-none">
            <CardHeader>
              <CardTitle>Weekly Sales Revenue</CardTitle>
              <CardDescription>Daily gross income comparison</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2226', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#66E3FF' }}
                  />
                  <Bar dataKey="sales" fill="hsl(195, 80%, 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glossy-card border-none">
            <CardHeader>
              <CardTitle>Profit Trends</CardTitle>
              <CardDescription>Visualizing growth over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2226', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#2C7CCF' }}
                  />
                  <Line type="monotone" dataKey="profit" stroke="hsl(225, 70%, 45%)" strokeWidth={3} dot={{ fill: 'hsl(195, 80%, 65%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
