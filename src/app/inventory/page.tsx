
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product } from "@/lib/types";
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
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter,
  Package,
  ArrowUpDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Product Inventory</h1>
            <p className="text-muted-foreground">Manage your stock, prices and listings.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 neon-glow">
                <Plus size={18} />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" className="col-span-3 bg-background" placeholder="Logitech MX Master 3S" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Input id="category" className="col-span-3 bg-background" placeholder="mouse" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">Cost Price</Label>
                  <Input id="cost" type="number" className="col-span-3 bg-background" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Selling Price</Label>
                  <Input id="price" type="number" className="col-span-3 bg-background" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock</Label>
                  <Input id="stock" type="number" className="col-span-3 bg-background" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-white/10">Cancel</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/80">Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search products or categories..." 
              className="pl-10 bg-card/50 border-white/10 focus:border-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 gap-2">
            <Filter size={18} />
            Filters
          </Button>
        </div>

        <div className="glossy-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="cursor-pointer">
                  <div className="flex items-center gap-2">Name <ArrowUpDown size={14}/></div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/10 capitalize">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">${product.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-accent">${product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      product.stockQuantity < 5 ? "bg-destructive/20 text-destructive" : "bg-green-500/20 text-green-400"
                    )}>
                      {product.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-destructive/20 hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Package size={48} className="text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No products found matching your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
