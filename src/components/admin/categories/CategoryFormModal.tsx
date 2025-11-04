"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/lib/types";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
  allCategories: Category[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  allCategories,
}: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState<string>(category?.description || "");
  const [imageUrl, setImageUrl] = useState<string | null>((category as any)?.image_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = await getAdminToken();
      const url = category
        ? `/api/admin/categories/${category.id}`
        : "/api/admin/categories";
      const method = category ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description: description || null, image_url: imageUrl }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save category');

      toast({
        title: "Success",
        description: `Category ${category ? "updated" : "created"}.`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{category ? "Edit" : "Create"} Category</DialogTitle>
          <DialogDescription>
            {category
              ? "Update the details for this category."
              : "Create a new category for your marketplace."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Image</Label>
            <div className="col-span-3 space-y-3">
              {imageUrl ? (
                <div className="flex items-center gap-4">
                  <img src={imageUrl} alt="Category" className="h-16 w-16 rounded object-cover border" />
                  <Button variant="outline" type="button" onClick={() => setImageUrl(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <CategoryImageUploader onUploaded={(url) => setImageUrl(url)} />
              )}
              <p className="text-xs text-slate-500">JPEG/PNG/WebP up to 5MB.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, WebP, or GIF image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setBusy(true);
    try {
      const token = await getAdminToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/categories/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      onUploaded(data.url);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully!',
      });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    try {
      (e.target as any).value = '';
    } catch {}
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50'
      } ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-sky-400'}`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={onPick}
        disabled={busy}
        className="hidden"
        id="category-image-upload"
      />
      <label htmlFor="category-image-upload" className="cursor-pointer">
        {busy ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="text-sm text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-sky-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JPEG, PNG, WebP, or GIF (max 5MB)
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}
