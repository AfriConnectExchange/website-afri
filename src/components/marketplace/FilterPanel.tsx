'use client';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { PriceFilter } from './PriceFilter';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { FilterState } from '@/app/marketplace/page';
import type { Category } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface PriceRange {
  min: number | null;
  max: number | null;
}

interface FilterPanelProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearAllFilters: () => void;
  currency?: string;
  isLoading?: boolean;
}

export function FilterPanel({
  categories,
  filters,
  onFiltersChange,
  onClearAllFilters,
  currency = '£',
  isLoading = false,
}: FilterPanelProps) {
  const handleCategoryChange = (categoryId: string, selected: boolean) => {
    let newCategories: string[];

    if (categoryId === 'all') {
      newCategories = selected ? ['all'] : [];
    } else {
      if (selected) {
        // Remove 'all' if selecting a specific category
        newCategories = [
          ...filters.selectedCategories.filter((id) => id !== 'all'),
          categoryId,
        ];
      } else {
        newCategories = filters.selectedCategories.filter(
          (id) => id !== categoryId
        );
      }
    }

    onFiltersChange({ selectedCategories: newCategories });
  };

  const handleClearCategories = () => {
    onFiltersChange({ selectedCategories: [] });
  };

  const handlePriceChange = (priceRange: PriceRange) => {
    onFiltersChange({ priceRange });
  };

  const handleClearPrice = () => {
    onFiltersChange({ priceRange: { min: null, max: null } });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes('all')) count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null)
      count++;
    if (filters.verifiedSellersOnly) count++;
    if (filters.featuredOnly) count++;
    if (filters.onSaleOnly) count++;
    if (filters.freeShippingOnly) count++;
    if (filters.freeListingsOnly) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
            </div>
            <Separator />
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-8" />
                    </div>
                ))}
            </div>
            <Separator />
             <div className="space-y-4">
                <Skeleton className="h-5 w-20" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-8 w-full" />
            </div>
            <Separator />
            <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                       <Skeleton className="h-4 w-4" />
                       <Skeleton className="h-4 w-32" />
                    </div>
                     <div className="flex items-center space-x-2">
                       <Skeleton className="h-4 w-4" />
                       <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <CategoryFilter
        categories={categories}
        selectedCategories={filters.selectedCategories}
        onCategoryChange={handleCategoryChange}
        onClearFilters={handleClearCategories}
        allowMultiple={false}
      />

      <Separator />

      {/* Price Range */}
      <PriceFilter
        value={filters.priceRange}
        onChange={handlePriceChange}
        onClearFilter={handleClearPrice}
        currency={currency}
      />

      <Separator />

      {/* Additional Filters */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Product Filters</Label>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-listings"
              checked={filters.freeListingsOnly}
              onCheckedChange={(checked) =>
                onFiltersChange({ freeListingsOnly: !!checked })
              }
            />
            <Label htmlFor="free-listings" className="text-sm">
              Free Listings Only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified-sellers"
              checked={filters.verifiedSellersOnly}
              onCheckedChange={(checked) =>
                onFiltersChange({ verifiedSellersOnly: !!checked })
              }
            />
            <Label htmlFor="verified-sellers" className="text-sm">
              Verified Sellers Only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={filters.onSaleOnly}
              onCheckedChange={(checked) =>
                onFiltersChange({ onSaleOnly: !!checked })
              }
            />
            <Label htmlFor="on-sale" className="text-sm">
              On Sale
            </Label>
          </div>

        </div>
      </div>
    </div>
  );
}
