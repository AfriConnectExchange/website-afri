import { Metadata } from 'next';
import { WishlistPage } from '@/components/wishlist/wishlist-page';

export const metadata: Metadata = {
  title: 'My Wishlist | AfriConnect',
  description: 'View and manage your saved items',
};

export default function Wishlist() {
  return <WishlistPage />;
}
