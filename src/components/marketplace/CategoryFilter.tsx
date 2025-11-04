'use client';
import { useState } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import type { Category } from '@/lib/types';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';


interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string, selected: boolean) => void;
  onClearFilters: () => void;
  allowMultiple?: boolean;
  initialDisplayCount?: number;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  onClearFilters,
  allowMultiple = false,
  initialDisplayCount = 7,
}: CategoryFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const handleCategoryClick = (categoryId: string) => {
    if (allowMultiple) {
      const isSelected = selectedCategories.includes(categoryId);
      onCategoryChange(categoryId, !isSelected);
    } else {
      // Single selection mode
      if (selectedCategories.includes(categoryId)) {
        onCategoryChange(categoryId, false);
      } else {
        // Clear all others and select this one
        selectedCategories.forEach((id) => {
          if (id !== categoryId) {
            onCategoryChange(id, false);
          }
        });
        onCategoryChange(categoryId, true);
      }
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const hasActiveFilters = selectedCategories.length > 0;

  // Determine which categories to display
  const displayedCategories = showAll 
    ? categories 
    : categories.slice(0, initialDisplayCount);
  
  const hasMoreCategories = categories.length > initialDisplayCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Categories</Label>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {displayedCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isAllCategory = category.id === 'all';
          const hasChildren = category.children && category.children.length > 0;
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id} className="space-y-1">
              {/* Main Category */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent border border-primary/20'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {/* Category image thumbnail - always show with fallback */}
                  <div className="w-6 h-6 rounded overflow-hidden bg-muted shrink-0">
                    <ImageWithFallback 
                      src={category.image_url || category.image || '/images/categories/placeholder.svg'} 
                      alt={category.name} 
                      width={24} 
                      height={24} 
                      fallbackSrc="/images/categories/placeholder.svg" 
                    />
                  </div>
                  <span
                    className={`text-sm ${isSelected ? 'font-medium' : ''}`}
                  >
                    {category.name}
                  </span>
                  {isSelected && !isAllCategory && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {category.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({category.count.toLocaleString()})
                    </span>
                  )}
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryExpansion(category.id);
                      }}
                    >
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    </Button>
                  )}
                </div>
              </div>

              {/* Subcategories (collapsible) */}
              {hasChildren && isExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-muted pl-2">
                  {(category.children || []).map((subcat: any) => {
                    const subId = subcat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const isSubSelected = selectedCategories.includes(subId);
                    
                    return (
                      <div
                        key={subId}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSubSelected
                            ? 'bg-accent border border-primary/20'
                            : 'hover:bg-accent/30'
                        }`}
                        onClick={() => handleCategoryClick(subId)}
                      >
                        <span className={`text-xs ${isSubSelected ? 'font-medium' : ''}`}>
                          {subcat.name}
                        </span>
                        {isSubSelected && (
                          <Badge variant="secondary" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load More / Show Less Button */}
      {hasMoreCategories && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Load More ({categories.length - initialDisplayCount} more)
            </>
          )}
        </Button>
      )}

      {hasActiveFilters && !allowMultiple && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            Filtering by:{' '}
            {selectedCategories
              .map((id) => categories.find((cat) => cat.id === id)?.name)
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
