
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/app/marketplace/page';
import { BarterProposalForm, type BarterFormData } from '../checkout/payments/BarterProposalForm';
import { PageLoader } from '../ui/loader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export function ProposeBarterPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const { toast } = useToast();
    const { user } = useAuth();

    const [targetProduct, setTargetProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Fetch from real API
                const response = await fetch(`/api/marketplace/products/${productId}`);
                if (!response.ok) {
                    throw new Error('Product not found');
                }
                const data = await response.json();
                setTargetProduct(data.product);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load product.' });
                setTargetProduct(null);
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [productId, toast]);

    const handleBarterConfirm = async (proposalData: BarterFormData) => {
        if (!targetProduct) return;
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to propose a barter.' });
            return;
        }
        
        try {
            // Call real barter API
            const response = await fetch('/api/barter/propose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify({
                    recipient_id: targetProduct.seller_id,
                    target_product_id: targetProduct.id,
                    offer_type: proposalData.offerType,
                    item_name: proposalData.itemName,
                    description: proposalData.description,
                    estimated_value: proposalData.estimatedValue,
                    condition: proposalData.condition,
                    category: proposalData.category,
                    exchange_location: proposalData.exchangePreference,
                    expiry: 7, // 7 days
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send proposal');
            }

            const data = await response.json();
            toast({
                title: 'Proposal Sent!',
                description: `Your barter proposal has been sent to the seller. Expires: ${new Date(data.expires_at).toLocaleDateString()}`,
            });
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        }
    };

    if (isLoading) {
        return <PageLoader />;
    }
    
    if (!targetProduct) {
        return (
             <div className="text-center">
                <h2 className="text-xl font-semibold">Product Not Found</h2>
                <p className="text-muted-foreground">The product you're trying to barter for could not be found.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/marketplace">Back to Marketplace</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link href={`/product/${productId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Product
            </Link>
            <BarterProposalForm 
                targetProduct={{
                  id: targetProduct.id,
                  name: targetProduct.name,
                  seller: targetProduct.seller,
                  estimatedValue: targetProduct.price,
                }}
                onConfirm={handleBarterConfirm}
                onCancel={() => {}}
            />
        </div>
    );
}
