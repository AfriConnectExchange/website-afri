
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  seller_id: string;
  price: number;
  status: 'pending_review' | 'active' | 'rejected' | 'sold' | 'inactive';
  listing_type: 'sale' | 'barter' | 'freebie';
  created_at: any;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_review');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error('Authentication failed');
      const response = await fetch(`/api/admin/products?status=${statusFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProducts(data.products || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load products: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getAdminToken, statusFilter, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = [...products];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(query) || p.id.toLowerCase().includes(query));
    }
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleUpdateStatus = async (productId: string, status: 'active' | 'rejected') => {
    try {
      const token = await getAdminToken();
      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      toast({ title: 'Success', description: `Product has been ${status}.` });
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update status: ' + error.message, variant: 'destructive' });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'pending_review': return <Badge variant="secondary">Pending Review</Badge>;
        case 'active': return <Badge variant="default">Active</Badge>;
        case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getListingTypeBadge = (type: string) => {
    switch(type) {
      case 'sale': return <Badge className="bg-green-100 text-green-800">Sale</Badge>;
      case 'barter': return <Badge className="bg-blue-100 text-blue-800">Barter</Badge>;
      case 'freebie': return <Badge className="bg-purple-100 text-purple-800">Freebie</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Product Management</h1>
        <p className="text-slate-600">Review, approve, and manage product listings.</p>
      </div>

      <Card className="bg-white mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by product title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Products</CardTitle>
          <CardDescription>{filteredProducts.length} of {products.length} products showing</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">No products match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>{getListingTypeBadge(product.listing_type)}</TableCell>
                      <TableCell>£{product.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        {product.created_at ? new Date(product.created_at._seconds * 1000).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/product/${product.id}`)}><Eye className="h-4 w-4" /></Button>
                          {product.status === 'pending_review' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(product.id, 'active')} className="text-green-600 hover:text-green-500"><CheckCircle className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(product.id, 'rejected')} className="text-red-600 hover:text-red-500"><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
