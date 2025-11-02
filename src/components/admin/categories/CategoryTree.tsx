"use client";

import { Category } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDeleteSuccess: () => void;
}

interface CategoryItemProps extends CategoryTreeProps {
  category: Category;
  level: number;
}

const CategoryItem = ({ category, level, onEdit, onDeleteSuccess }: CategoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();

  const hasChildren = category.children && category.children.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getAdminToken();
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: "Success", description: "Category deleted." });
      onDeleteSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
        <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
          {hasChildren && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2 p-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <span className="w-8"></span>}
          <span className="font-medium">{category.name}</span>
          {category.slug && <span className="ml-2 text-xs text-slate-500">({category.slug})</span>}
        </div>
        <div className="space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteModalOpen(true)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
            <Trash size={16} />
          </Button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children?.map(child => (
            <CategoryItem key={child.id} category={child} level={level + 1} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} categories={[]} />
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Category?"
        description={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export const CategoryTree = ({ categories, onEdit, onDeleteSuccess }: CategoryTreeProps) => {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        {categories.length === 0 ? (
          <p className="text-center text-slate-600 py-8">No categories found.</p>
        ) : (
          categories.map(category => (
            <CategoryItem key={category.id} category={category} level={0} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} categories={[]} />
          ))
        )}
      </CardContent>
    </Card>
  );
};
