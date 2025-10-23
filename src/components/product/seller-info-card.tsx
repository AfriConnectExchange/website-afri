
 'use client';

import VerifiedIcon from '@mui/icons-material/Verified';
import { Star, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SellerInfoCardProps {
  sellerDetails: {
    name: string;
    avatar: string;
    location: string;
    verified: boolean;
    rating: number; // Mock
    totalSales: number; // Mock
    memberSince: string;
  };
}

export function SellerInfoCard({ sellerDetails }: SellerInfoCardProps) {
  // Defensive defaults if sellerDetails is missing or partial
  const name = sellerDetails?.name ?? 'Unknown Seller';
  const avatarSrc = sellerDetails?.avatar ?? undefined;
  const location = sellerDetails?.location ?? 'Unknown location';
  const verified = !!sellerDetails?.verified;
  const rating = typeof sellerDetails?.rating === 'number' ? sellerDetails.rating : 0;
  const totalSales = typeof sellerDetails?.totalSales === 'number' ? sellerDetails.totalSales : 0;
  const memberSince = sellerDetails?.memberSince ?? 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Seller Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={`${name}'s avatar`} />
            ) : (
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{name}</span>
              {verified && (
                <VerifiedIcon
                  role="img"
                  aria-label="Verified seller"
                  style={{ color: '#ff2d55', fontSize: 18 }}
                  className="ml-1"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sales</span>
            <span>{totalSales}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Joined</span>
            <span>{memberSince}</span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Seller
        </Button>
      </CardContent>
    </Card>
  );
}
