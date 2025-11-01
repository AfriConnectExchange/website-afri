'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, X, FolderOpen, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Category } from '@/lib/types';

interface CategoryPickerProps {
  selectedCategoryId?: string;
  onSelect: (category: Category) => void;
  placeholder?: string;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function CategoryPicker({
  selectedCategoryId,
  onSelect,
  placeholder = 'Select a category',
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories/list');
      const data = await response.json();
      
      if (data.categories) {
        // Build hierarchical tree
        const tree = buildCategoryTree(data.categories);
        setCategories(tree);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build category tree from flat list
  const buildCategoryTree = (flatCategories: Category[]): CategoryNode[] => {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Create map of all categories
    flatCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Build tree structure
    flatCategories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        const parent = map.get(cat.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order field
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodes.forEach((node) => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(roots);

    return roots;
  };

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    const matches: CategoryNode[] = [];

    const searchNode = (node: CategoryNode): boolean => {
      const nameMatches = node.name.toLowerCase().includes(query);
      const descMatches = node.description?.toLowerCase().includes(query);
      
      let hasMatchingChildren = false;
      if (node.children) {
        const matchingChildren = node.children.filter(searchNode);
        hasMatchingChildren = matchingChildren.length > 0;
        if (hasMatchingChildren) {
          matches.push({ ...node, children: matchingChildren });
        }
      }

      if (nameMatches || descMatches) {
        if (!hasMatchingChildren) {
          matches.push(node);
        }
        return true;
      }

      return hasMatchingChildren;
    };

    categories.forEach(searchNode);
    return matches;
  }, [categories, searchQuery]);

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelect = (category: Category) => {
    onSelect(category);
    
    // Build breadcrumb
    const path: Category[] = [];
    let current: Category | undefined = category;
    
    while (current) {
      path.unshift(current);
      if (current.parent_id) {
        current = findCategoryById(categories, current.parent_id);
      } else {
        break;
      }
    }
    
    setBreadcrumb(path);
  };

  const findCategoryById = (
    nodes: CategoryNode[],
    id: string
  ): Category | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findCategoryById(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const renderCategory = (category: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = category.id === selectedCategoryId;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer
            hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-brand-diaspora-orange/10 border-l-4 border-brand-diaspora-orange' : ''}
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(category.id);
            } else {
              handleSelect(category);
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-brand-progress-blue flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )
          ) : (
            <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 ml-1.5" />
          )}

          <div className="flex-1 min-w-0">
            <p className={`text-sm truncate ${isSelected ? 'font-semibold text-brand-diaspora-orange' : 'text-gray-900'}`}>
              {category.name}
            </p>
            {category.description && depth === 0 && (
              <p className="text-xs text-gray-500 truncate">
                {category.description}
              </p>
            )}
          </div>

          {category.count !== undefined && category.count > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({category.count})
            </span>
          )}
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {category.children!.map((child) =>
              renderCategory(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-progress-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Selected:</span>
          {breadcrumb.map((cat, index) => (
            <div key={cat.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              <span
                className={
                  index === breadcrumb.length - 1
                    ? 'font-semibold text-brand-diaspora-orange'
                    : 'text-gray-600'
                }
              >
                {cat.name}
              </span>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBreadcrumb([]);
              onSelect({} as Category); // Clear selection
            }}
            className="ml-2 h-6 text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Category Tree */}
      <ScrollArea className="h-[400px] border rounded-lg p-2">
        {filteredCategories.length > 0 ? (
          <div className="space-y-1">
            {filteredCategories.map((category) => renderCategory(category))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Search className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-600">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Mobile: Quick Categories */}
      <div className="sm:hidden flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchQuery('Electronics')}
        >
          📱 Electronics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchQuery('Fashion')}
        >
          👕 Fashion
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchQuery('Home')}
        >
          🏠 Home
        </Button>
      </div>
    </div>
  );
}
