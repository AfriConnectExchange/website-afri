'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, Upload, Loader2, AlertCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import categoriesData from '@/data/mock-categories.json';

// Extract top-level categories from the hierarchical data
const CATEGORIES = categoriesData.map(cat => ({
  id: cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  name: cat.name,
  description: cat.description,
}));

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  stock_quantity: string;
  condition: string;
  shipping_weight: string;
  shipping_length: string;
  shipping_width: string;
  shipping_height: string;
  accepts_cash: boolean;
  accepts_online: boolean;
  accepts_escrow: boolean;
  accepts_barter: boolean;
  images: File[];
  imagePreviewUrls: string[];
  location: {
    address_line1: string;
    address_line2: string;
    city: string;
    postcode: string;
    country: string;
  };
}

export default function CreateProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '1',
    condition: 'new',
    shipping_weight: '',
    shipping_length: '',
    shipping_width: '',
    shipping_height: '',
    accepts_cash: true,
    accepts_online: true,
    accepts_escrow: false,
    accepts_barter: false,
    images: [],
    imagePreviewUrls: [],
    location: {
      address_line1: '',
      address_line2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
    },
  });

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (formData.images.length + files.length > 4) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: 'Maximum 4 images allowed per product',
      });
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > 2 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Each image must be under 2MB',
      });
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviewUrls: [...prev.imagePreviewUrls, ...newPreviewUrls],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviewUrls: prev.imagePreviewUrls.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (formData.title.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title must be at least 3 characters',
      });
      return false;
    }

    if (formData.description.length < 20) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Description must be at least 20 characters',
      });
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid price greater than 0',
      });
      return false;
    }

    if (!formData.category) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a category',
      });
      return false;
    }

    const stock = parseInt(formData.stock_quantity);
    if (isNaN(stock) || stock < 1) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Stock quantity must be at least 1',
      });
      return false;
    }

    if (formData.images.length < 1) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please upload at least 1 product image',
      });
      return false;
    }

    if (!formData.location.address_line1) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter an address',
      });
      return false;
    }

    if (!formData.location.city) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a city',
      });
      return false;
    }

    if (!formData.location.postcode) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a postcode',
      });
      return false;
    }

    if (!formData.accepts_cash && !formData.accepts_online && !formData.accepts_escrow && !formData.accepts_barter) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one payment method',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Upload images first (in real app, use cloud storage like Firebase Storage)
      // For now, we'll convert to base64 for demo
      const imageUrls: string[] = [];
      for (const file of formData.images) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageUrls.push(base64);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock_quantity: parseInt(formData.stock_quantity),
        condition: formData.condition,
        location: {
          address_line1: formData.location.address_line1,
          address_line2: formData.location.address_line2 || null,
          city: formData.location.city,
          postcode: formData.location.postcode,
          country: formData.location.country,
        },
        shipping: {
          weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : null,
          dimensions: {
            length: formData.shipping_length ? parseFloat(formData.shipping_length) : null,
            width: formData.shipping_width ? parseFloat(formData.shipping_width) : null,
            height: formData.shipping_height ? parseFloat(formData.shipping_height) : null,
          },
        },
        payment_methods: {
          cash_on_delivery: formData.accepts_cash,
          online_payment: formData.accepts_online,
          escrow: formData.accepts_escrow,
          barter: formData.accepts_barter,
        },
        images: imageUrls,
      };

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to create a product');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      toast({
        title: 'Product Created!',
        description: 'Your product has been listed successfully',
      });

      router.push('/seller/products');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create product',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">List a New Product</h1>
        <p className="text-muted-foreground">
          Fill in the details below to list your product on the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Handwoven African Basket"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/100 characters (minimum 3)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/1000 characters (minimum 20)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => handleInputChange('category', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(val) => handleInputChange('condition', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(cond => (
                      <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Set your price and stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (£) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images *</CardTitle>
            <CardDescription>Upload up to 4 images (max 2MB each, JPEG/PNG)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length < 4 && (
                <div>
                  <Label htmlFor="images" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload images</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.images.length}/4 images uploaded
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information (Optional)</CardTitle>
            <CardDescription>Add shipping details for better delivery estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.shipping_weight}
                  onChange={(e) => handleInputChange('shipping_weight', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.shipping_length}
                  onChange={(e) => handleInputChange('shipping_length', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.shipping_width}
                  onChange={(e) => handleInputChange('shipping_width', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.shipping_height}
                  onChange={(e) => handleInputChange('shipping_height', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Product Location *</CardTitle>
            <CardDescription>Where is this product located? This helps buyers find nearby items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                placeholder="Street address, P.O. box"
                value={formData.location.address_line1}
                onChange={(e) => handleInputChange('location', { ...formData.location, address_line1: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                placeholder="Apartment, suite, unit, building, floor, etc."
                value={formData.location.address_line2}
                onChange={(e) => handleInputChange('location', { ...formData.location, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.location.city}
                  onChange={(e) => handleInputChange('location', { ...formData.location, city: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  placeholder="Postcode"
                  value={formData.location.postcode}
                  onChange={(e) => handleInputChange('location', { ...formData.location, postcode: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.location.country}
                  onChange={(e) => handleInputChange('location', { ...formData.location, country: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Accepted Payment Methods *</CardTitle>
            <CardDescription>Select which payment methods you accept</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cash"
                  checked={formData.accepts_cash}
                  onCheckedChange={(checked) => handleInputChange('accepts_cash', checked)}
                />
                <Label htmlFor="cash" className="cursor-pointer">
                  Cash on Delivery
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online"
                  checked={formData.accepts_online}
                  onCheckedChange={(checked) => handleInputChange('accepts_online', checked)}
                />
                <Label htmlFor="online" className="cursor-pointer">
                  Online Payment (Card/Wallet)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="escrow"
                  checked={formData.accepts_escrow}
                  onCheckedChange={(checked) => handleInputChange('accepts_escrow', checked)}
                />
                <Label htmlFor="escrow" className="cursor-pointer">
                  Escrow (Secure Payment)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="barter"
                  checked={formData.accepts_barter}
                  onCheckedChange={(checked) => handleInputChange('accepts_barter', checked)}
                />
                <Label htmlFor="barter" className="cursor-pointer">
                  Barter (Trade)
                </Label>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must select at least one payment method to list your product.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                List Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
