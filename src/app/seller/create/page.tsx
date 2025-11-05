
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
import { LocationAutocomplete } from '@/components/forms/location-autocomplete';

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
  imageUrls: string[]; // Store public URLs from Firebase Storage
  specifications: Record<string, string>;
  location: {
    address: string;
    city: string;
    region?: string;
    country: string;
    postal_code: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    formatted_address?: string;
  };
}

// Category-specific specification fields
const SPECIFICATION_FIELDS: Record<string, Array<{ key: string; label: string; type?: string; required?: boolean }>> = {
  'electronics': [
    { key: 'brand', label: 'Brand', required: true },
    { key: 'model', label: 'Model', required: true },
    { key: 'processor', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'screen_size', label: 'Screen Size' },
    { key: 'battery_life', label: 'Battery Life' },
    { key: 'color', label: 'Color' },
    { key: 'warranty', label: 'Warranty Period' },
  ],
  'fashion': [
    { key: 'brand', label: 'Brand' },
    { key: 'size', label: 'Size', required: true },
    { key: 'color', label: 'Color', required: true },
    { key: 'material', label: 'Material' },
    { key: 'style', label: 'Style' },
    { key: 'gender', label: 'Gender' },
    { key: 'season', label: 'Season' },
  ],
  'furniture': [
    { key: 'material', label: 'Material', required: true },
    { key: 'dimensions', label: 'Dimensions (L x W x H)', required: true },
    { key: 'weight', label: 'Weight' },
    { key: 'color', label: 'Color' },
    { key: 'style', label: 'Style' },
    { key: 'assembly_required', label: 'Assembly Required' },
    { key: 'room', label: 'Room Type' },
  ],
  'home': [
    { key: 'material', label: 'Material' },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'weight', label: 'Weight' },
    { key: 'color', label: 'Color' },
    { key: 'room', label: 'Room Type' },
    { key: 'style', label: 'Style' },
  ],
  'garden': [
    { key: 'material', label: 'Material' },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'weight', label: 'Weight' },
    { key: 'suitable_for', label: 'Suitable For' },
    { key: 'care_instructions', label: 'Care Instructions' },
  ],
  'groceries': [
    { key: 'brand', label: 'Brand' },
    { key: 'weight', label: 'Weight/Volume', required: true },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'nutritional_info', label: 'Nutritional Information' },
    { key: 'allergens', label: 'Allergens' },
    { key: 'expiry_date', label: 'Expiry/Best Before Date', required: true },
    { key: 'origin', label: 'Country of Origin' },
    { key: 'storage_instructions', label: 'Storage Instructions' },
  ],
  'food': [
    { key: 'brand', label: 'Brand' },
    { key: 'weight', label: 'Weight/Volume', required: true },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'nutritional_info', label: 'Nutritional Information' },
    { key: 'allergens', label: 'Allergens' },
    { key: 'expiry_date', label: 'Expiry/Best Before Date', required: true },
    { key: 'origin', label: 'Country of Origin' },
    { key: 'storage_instructions', label: 'Storage Instructions' },
  ],
  'beauty': [
    { key: 'brand', label: 'Brand' },
    { key: 'size', label: 'Size/Volume' },
    { key: 'ingredients', label: 'Key Ingredients' },
    { key: 'skin_type', label: 'Skin Type' },
    { key: 'scent', label: 'Scent' },
    { key: 'expiry_date', label: 'Expiry Date' },
  ],
  'health': [
    { key: 'brand', label: 'Brand' },
    { key: 'type', label: 'Product Type' },
    { key: 'ingredients', label: 'Active Ingredients' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'expiry_date', label: 'Expiry Date', required: true },
  ],
  'sports': [
    { key: 'brand', label: 'Brand' },
    { key: 'size', label: 'Size' },
    { key: 'color', label: 'Color' },
    { key: 'material', label: 'Material' },
    { key: 'weight', label: 'Weight' },
    { key: 'suitable_for', label: 'Suitable For' },
  ],
  'automobiles': [
    { key: 'make', label: 'Make', required: true },
    { key: 'model', label: 'Model', required: true },
    { key: 'year', label: 'Year', type: 'number', required: true },
    { key: 'mileage', label: 'Mileage', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'engine_size', label: 'Engine Size' },
    { key: 'body_type', label: 'Body Type' },
    { key: 'color', label: 'Color' },
    { key: 'doors', label: 'Number of Doors', type: 'number' },
    { key: 'seats', label: 'Number of Seats', type: 'number' },
  ],
  'vehicles': [
    { key: 'make', label: 'Make', required: true },
    { key: 'model', label: 'Model', required: true },
    { key: 'year', label: 'Year', type: 'number', required: true },
    { key: 'mileage', label: 'Mileage', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'engine_size', label: 'Engine Size' },
    { key: 'color', label: 'Color' },
  ],
  'real-estate': [
    { key: 'property_type', label: 'Property Type', required: true },
    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
    { key: 'area', label: 'Area (sq ft)', type: 'number' },
    { key: 'furnished', label: 'Furnished Status' },
    { key: 'year_built', label: 'Year Built', type: 'number' },
    { key: 'parking', label: 'Parking Spaces', type: 'number' },
  ],
  'services': [
    { key: 'service_type', label: 'Service Type', required: true },
    { key: 'duration', label: 'Estimated Duration' },
    { key: 'availability', label: 'Availability' },
    { key: 'experience', label: 'Years of Experience' },
    { key: 'certifications', label: 'Certifications' },
  ],
  'books': [
    { key: 'author', label: 'Author', required: true },
    { key: 'publisher', label: 'Publisher' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'publication_year', label: 'Publication Year', type: 'number' },
    { key: 'language', label: 'Language' },
    { key: 'pages', label: 'Number of Pages', type: 'number' },
    { key: 'format', label: 'Format (Hardcover/Paperback)' },
  ],
};

const getCategorySpecFields = (categoryId: string, categoryName: string): Array<{ key: string; label: string; type?: string; required?: boolean }> => {
  const searchText = `${categoryId} ${categoryName}`.toLowerCase();
  
  for (const [key, fields] of Object.entries(SPECIFICATION_FIELDS)) {
    if (searchText.includes(key)) {
      return fields;
    }
  }
  
  return [];
};

export default function CreateProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
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
    imageUrls: [],
    specifications: {},
    location: {
      address: '',
      city: '',
      region: '',
      country: 'United Kingdom',
      postal_code: '',
      coordinates: undefined,
      formatted_address: '',
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/list');
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load categories. Please refresh the page.',
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
  };

  const selectedCategory = categories.find(c => c.id === formData.category);
  const currentSpecFields = selectedCategory 
    ? getCategorySpecFields(formData.category, selectedCategory.name) 
    : [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.imageUrls.length + files.length > 4) {
      toast({ variant: 'destructive', title: 'Too many images', description: 'Maximum 4 images allowed.' });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Authentication required");
      const token = await currentUser.getIdToken();

      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File too large', description: `${file.name} is over 2MB.` });
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        uploadedUrls.push(data.url);
      }

      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploadedUrls] }));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Image Upload Failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (formData.title.length < 3) errors.push('Title must be at least 3 characters.');
    if (formData.description.length < 20) errors.push('Description must be at least 20 characters.');
    if (!formData.category) errors.push('Please select a category.');
    if (parseFloat(formData.price) <= 0) errors.push('Price must be greater than zero.');
    if (parseInt(formData.stock_quantity) < 1) errors.push('Stock must be at least 1.');
    if (formData.imageUrls.length === 0) errors.push('At least one image is required.');
    if (!formData.location.address || !formData.location.city) errors.push('A valid product location is required.');
    if (!formData.accepts_cash && !formData.accepts_online && !formData.accepts_escrow && !formData.accepts_barter) {
      errors.push('Please select at least one payment method.');
    }
  
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Errors',
        description: (
          <ul className="list-disc list-inside">
            {errors.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        ),
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
      const payload = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category,
        product_type: 'physical',
        listing_type: 'sale',
        price: parseFloat(formData.price),
        currency: 'GBP',
        quantity_available: parseInt(formData.stock_quantity),
        condition: formData.condition,
        location: {
          address: formData.location.address,
          city: formData.location.city,
          region: formData.location.region,
          country: formData.location.country,
          postal_code: formData.location.postal_code,
          coordinates: formData.location.coordinates,
        },
        shipping_policy: {
          weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : null,
          dimensions: formData.shipping_length || formData.shipping_width || formData.shipping_height ? {
            length: formData.shipping_length ? parseFloat(formData.shipping_length) : null,
            width: formData.shipping_width ? parseFloat(formData.shipping_width) : null,
            height: formData.shipping_height ? parseFloat(formData.shipping_height) : null,
          } : null,
        },
        is_local_pickup_only: !formData.accepts_online,
        payment_methods: {
          cash_on_delivery: formData.accepts_cash,
          online_payment: formData.accepts_online,
          escrow: formData.accepts_escrow,
          barter: formData.accepts_barter,
        },
        barter_preferences: formData.accepts_barter ? formData.description : null,
        images: formData.imageUrls.map((url, index) => ({ url, alt: formData.title, order: index, is_primary: index === 0 })),
        tags: [],
        specifications: formData.specifications,
        status: 'active',
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">List a New Product</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Fill in the details below to list your product on the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Essential details about your product</CardDescription>
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
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => handleInputChange('category', val)}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
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
            <CardTitle className="text-lg sm:text-xl">Pricing & Inventory</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Set your price and stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Product Specifications */}
        {currentSpecFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Product Specifications</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Provide specific details about your {categories.find(c => c.id === formData.category)?.name || 'product'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSpecFields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>
                      {field.label} {field.required && '*'}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type || 'text'}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData.specifications[field.key] || ''}
                      onChange={(e) => handleSpecificationChange(field.key, e.target.value)}
                      required={field.required}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Product Images *</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Upload up to 4 images (max 2MB each, JPEG/PNG)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {formData.imageUrls.map((url, index) => (
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
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.imageUrls.length < 4 && (
                <div>
                  <Label htmlFor="images" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:border-primary transition-colors">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload images</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.imageUrls.length}/4 images uploaded
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Shipping Information (Optional)</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Add shipping details for better delivery estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
            <CardTitle className="text-lg sm:text-xl">Product Location *</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Where is this product located? This helps buyers find nearby items.</CardDescription>
          </CardHeader>
          <CardContent>
            <LocationAutocomplete
              onLocationSelect={(locationData) => {
                setFormData(prev => ({
                  ...prev,
                  location: {
                    address: locationData.address,
                    city: locationData.city,
                    region: locationData.region,
                    country: locationData.country,
                    postal_code: locationData.postal_code,
                    coordinates: locationData.coordinates,
                    formatted_address: locationData.formatted_address,
                  }
                }));
              }}
              defaultValue={formData.location.formatted_address || ''}
              placeholder="Start typing your address..."
              label="Product Location"
            />
            
            {formData.location.coordinates && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  ✓ Location Set: {formData.location.city}, {formData.location.postal_code}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Coordinates: {formData.location.coordinates.lat.toFixed(4)}, {formData.location.coordinates.lng.toFixed(4)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Accepted Payment Methods *</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Select which payment methods you accept</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cash"
                  checked={formData.accepts_cash}
                  onCheckedChange={(checked) => handleInputChange('accepts_cash', checked)}
                />
                <Label htmlFor="cash" className="cursor-pointer text-sm">
                  Cash on Delivery
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online"
                  checked={formData.accepts_online}
                  onCheckedChange={(checked) => handleInputChange('accepts_online', checked)}
                />
                <Label htmlFor="online" className="cursor-pointer text-sm">
                  Online Payment (Card/Wallet)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="escrow"
                  checked={formData.accepts_escrow}
                  onCheckedChange={(checked) => handleInputChange('accepts_escrow', checked)}
                />
                <Label htmlFor="escrow" className="cursor-pointer text-sm">
                  Escrow (Secure Payment)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="barter"
                  checked={formData.accepts_barter}
                  onCheckedChange={(checked) => handleInputChange('accepts_barter', checked)}
                />
                <Label htmlFor="barter" className="cursor-pointer text-sm">
                  Barter (Trade)
                </Label>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                You must select at least one payment method to list your product.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="w-full sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full sm:flex-1"
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploading ? 'Uploading...' : 'Creating...'}
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
