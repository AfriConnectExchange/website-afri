'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, Eye, Search, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  condition: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  images: Array<{ url: string; alt?: string; order?: number; is_primary?: boolean }> | string[];
  created_at: any;
  views?: number;
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load products',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      toast({
        title: 'Product Deleted',
        description: 'Your product has been removed successfully',
      });

      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete product',
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, productId: null });
    }
  };

  const getStatusBadge = (status: string, stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (status === 'active') {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  // Helper to safely get image URL from product images
  const getProductImageUrl = (images: Product['images']): string | null => {
    if (!images || images.length === 0) return null;
    
    const firstImage = images[0];
    
    // Handle object format { url: string }
    if (typeof firstImage === 'object' && firstImage !== null && 'url' in firstImage) {
      return firstImage.url || null;
    }
    
    // Handle string format
    if (typeof firstImage === 'string' && firstImage.trim() !== '') {
      return firstImage;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header - Mobile First */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product listings
          </p>
        </div>
        <Button onClick={() => router.push('/seller/create')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          List New Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards - Mobile First Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Total Products</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Active</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-green-600">
              {products.filter(p => p.status === 'active' && p.stock_quantity > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Out of Stock</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-orange-600">
              {products.filter(p => p.stock_quantity === 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Total Value</CardDescription>
            <CardTitle className="text-xl sm:text-3xl">
              £{products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start listing your products to reach thousands of buyers'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/seller/create')}>
                <Plus className="w-4 h-4 mr-2" />
                List Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const imageUrl = getProductImageUrl(product.images);
            
            return (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/product/${product.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/seller/edit/${product.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, productId: product.id })}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm sm:text-base line-clamp-1 flex-1">{product.title}</h3>
                  {getStatusBadge(product.status, product.stock_quantity)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">£{product.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.stock_quantity}
                    </p>
                  </div>
                  {product.views !== undefined && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.views}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, productId: null })}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.productId && handleDelete(deleteDialog.productId)}
              className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
