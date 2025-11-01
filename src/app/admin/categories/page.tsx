"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Category } from "@/lib/types";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTree } from "@/components/admin/categories/CategoryTree";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { getAdminToken } = useAdminAuth();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const token = await getAdminToken();
      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setCategories(data.categories);

      // Create a flat list for the parent dropdown
      const flatten = (cats: Category[]): Category[] => {
        return cats.reduce<Category[]>((acc, cat) => {
          acc.push({ ...cat, children: undefined }); // Add parent
          if (cat.children && cat.children.length > 0) {
            acc.push(...flatten(cat.children)); // Add children
          }
          return acc;
        }, []);
      };
      setAllCategoriesFlat(flatten(data.categories));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSuccess = () => {
    fetchCategories();
    handleCloseModal();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Product Categories</h1>
          <p className="text-slate-400">Manage your hierarchical product categories.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-sky-500 hover:bg-sky-600">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <CategoryTree 
        categories={categories} 
        onEdit={handleOpenModal}
        onDeleteSuccess={fetchCategories}
      />

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          category={editingCategory}
          allCategories={allCategoriesFlat}
        />
      )}
    </div>
  );
}
