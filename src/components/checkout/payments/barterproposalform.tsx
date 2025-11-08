"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BarterFormData = {
  offerType: "product" | "service";
  itemName: string;
  description: string;
  estimatedValue: number;
  condition: string;
  category?: string;
  exchangePreference?: string;
};

export function BarterProposalForm({
  targetProduct,
  onConfirm,
  onCancel,
}: {
  targetProduct: { id: string; name: string; seller?: string; estimatedValue?: number };
  onConfirm: (data: BarterFormData) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [offerType, setOfferType] = useState<"product" | "service">("product");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(targetProduct.estimatedValue ?? 0);
  const [condition, setCondition] = useState("Good");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({ offerType, itemName, description, estimatedValue, condition });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Propose a barter for</h3>
        <div className="text-sm text-muted-foreground">{targetProduct.name}</div>
      </div>

      <div>
        <Label>Offer Type</Label>
        <div className="flex gap-2 mt-2">
          <Button variant={offerType === "product" ? "default" : "outline"} onClick={() => setOfferType("product")}>Product</Button>
          <Button variant={offerType === "service" ? "default" : "outline"} onClick={() => setOfferType("service")}>Service</Button>
        </div>
      </div>

      <div>
        <Label>Item Name</Label>
        <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="What are you offering?" />
      </div>

      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
      </div>

      <div>
        <Label>Estimated Value (£)</Label>
        <Input type="number" value={String(estimatedValue)} onChange={(e) => setEstimatedValue(Number(e.target.value) || 0)} />
      </div>

      <div>
        <Label>Condition</Label>
        <Input value={condition} onChange={(e) => setCondition(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <Button type="submit">Send Proposal</Button>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default BarterProposalForm;
