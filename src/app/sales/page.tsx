
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_SALES } from "@/lib/mock-data";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function SalesHistory() {
  const [sales] = useState(MOCK_SALES);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Transaction History</h1>
            <p className="text-muted-foreground">Review and audit all shop sales records.</p>
          </div>
          <Button variant="outline" className="border-white/10 gap-2">
            <Download size={18} />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search transaction ID..." className="pl-10 bg-card/50 border-white/10" />
          </div>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="date" className="pl-10 bg-card/50 border-white/10" />
          </div>
          <Button variant="outline" className="border-white/10 gap-2 w-full md:w-auto">
            <Filter size={18} />
            Filter by Payment Mode
          </Button>
        </div>

        <div className="glossy-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead>Date & Time</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Products Sold</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-sm">
                    {format(new Date(sale.saleDate), "MMM dd, yyyy • HH:mm")}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-accent">#{sale.id.toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/10 uppercase text-[10px]">
                      {sale.paymentMode.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ${sale.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
