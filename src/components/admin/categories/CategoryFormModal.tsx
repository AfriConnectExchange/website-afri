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

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
      try { (e.target as any).value = ''; } catch {}
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onPick} disabled={busy} />
    </div>
  );
}
