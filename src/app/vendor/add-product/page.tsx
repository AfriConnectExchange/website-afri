'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ArrowBack, ArrowForward, Check, Close, Add, Delete, CloudUpload } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { CreateProductFormData, Category, ListingType, ProductType, ProductStatus } from '@/lib/productTypes';

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState<CreateProductFormData>({
    // Basic info
    title: '',
    description: '',
    product_type: 'product',
    category_id: '',
    tags: [],
    
    // Listing & pricing
    listing_type: 'sale',
    price: 0,
    currency: 'GBP',
    barter_preferences: {
      willing_to_barter: false,
      desired_items: [],
    },
    
    // Inventory
    quantity_available: 1,
    sku: '',
    condition: 'new',
    
    // Media
    images: [],
    video_url: '',
    
    // Specifications
    specifications: {},
    
    // Location
    location: {
      country: 'UK',
      city: '',
      postal_code: '',
      latitude: 0,
      longitude: 0,
    },
    
    // Shipping
    shipping_policy: {
      domestic_shipping: true,
      international_shipping: false,
      shipping_cost: 0,
      estimated_delivery_days: 7,
    },
    is_local_pickup_only: false,
    
    // Status
    status: 'draft',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories/list');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      const token = await user?.getIdToken();
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await fetch('/api/products/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataUpload,
        });

        const data = await res.json();
        if (data.success) {
          uploadedUrls.push(data.url);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      showSnackbar('Images uploaded successfully!', 'success');
    } catch (error) {
      console.error('Failed to upload images:', error);
      showSnackbar('Failed to upload images', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];
    
    try {
      const token = await user?.getIdToken();
      await fetch(`/api/products/upload-image?url=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleSubmit = async (status: ProductStatus) => {
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, status }),
      });

      const data = await res.json();

      if (data.success) {
        showSnackbar(data.message, 'success');
        setTimeout(() => {
          router.push('/vendor/products');
        }, 1500);
      } else {
        showSnackbar(data.error || 'Failed to create product', 'error');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showSnackbar('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 3000);
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const steps = [
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Pricing & Listing' },
    { number: 3, title: 'Inventory' },
    { number: 4, title: 'Images' },
    { number: 5, title: 'Shipping & Location' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new listing for your shop</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Close className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep === step.number
                    ? 'bg-black text-white'
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <p className="text-xs mt-2 text-center">{step.title}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg border p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter product title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="product_type">Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: ProductType) => setFormData({ ...formData, product_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Physical Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                placeholder="handmade, traditional, unique"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Listing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="listing_type">Listing Type *</Label>
              <Select
                value={formData.listing_type}
                onValueChange={(value: ListingType) => setFormData({ ...formData, listing_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="barter">Barter/Trade</SelectItem>
                  <SelectItem value="freebie">Free Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.listing_type !== 'freebie' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.listing_type === 'barter' && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="willing_to_barter"
                    checked={formData.barter_preferences.willing_to_barter}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        barter_preferences: { ...formData.barter_preferences, willing_to_barter: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="willing_to_barter">Open to barter offers</Label>
                </div>

                {formData.barter_preferences.willing_to_barter && (
                  <div>
                    <Label htmlFor="desired_items">Desired Items (comma separated)</Label>
                    <Input
                      id="desired_items"
                      value={formData.barter_preferences.desired_items.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          barter_preferences: {
                            ...formData.barter_preferences,
                            desired_items: e.target.value.split(',').map((item) => item.trim()),
                          },
                        })
                      }
                      placeholder="e.g., art supplies, books, electronics"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="condition">Condition *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Inventory */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="quantity">Quantity Available *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity_available}
                onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) })}
                placeholder="1"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU (optional)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter product SKU"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <Label>Product Images *</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-4">Upload up to 10 images (max 5MB each)</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImage || formData.images.length >= 10}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outline"
                    disabled={uploadingImage || formData.images.length >= 10}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    type="button"
                  >
                    {uploadingImage ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Image Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Delete className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="video_url">Video URL (optional)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 5: Shipping & Location */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })
                  }
                  placeholder="London"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.location.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, location: { ...formData.location, postal_code: e.target.value } })
                  }
                  placeholder="SW1A 1AA"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="local_pickup"
                checked={formData.is_local_pickup_only}
                onCheckedChange={(checked) => setFormData({ ...formData, is_local_pickup_only: checked as boolean })}
              />
              <Label htmlFor="local_pickup">Local pickup only (no shipping)</Label>
            </div>

            {!formData.is_local_pickup_only && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="domestic"
                    checked={formData.shipping_policy.domestic_shipping}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        shipping_policy: { ...formData.shipping_policy, domestic_shipping: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="domestic">Domestic shipping</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="international"
                    checked={formData.shipping_policy.international_shipping}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        shipping_policy: { ...formData.shipping_policy, international_shipping: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="international">International shipping</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_cost">Shipping Cost (£)</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      value={formData.shipping_policy.shipping_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_policy: { ...formData.shipping_policy, shipping_cost: parseFloat(e.target.value) },
                        })
                      }
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_days">Estimated Delivery (days)</Label>
                    <Input
                      id="delivery_days"
                      type="number"
                      value={formData.shipping_policy.estimated_delivery_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_policy: {
                            ...formData.shipping_policy,
                            estimated_delivery_days: parseInt(e.target.value),
                          },
                        })
                      }
                      placeholder="7"
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowBack className="mr-2 h-4 w-4" /> Previous
        </Button>

        <div className="flex gap-3">
          {currentStep === 5 ? (
            <>
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading}>
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit('active')} disabled={loading} className="bg-black text-white">
                {loading ? 'Publishing...' : 'Publish Product'}
              </Button>
            </>
          ) : (
            <Button onClick={nextStep}>
              Next <ArrowForward className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            snackbar.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
