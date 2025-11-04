import { LayoutDashboard, PackageSearch, PackageCheck, Star, Wallet, BarChart3, Receipt } from 'lucide-react';

export type SellerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  matchExact?: boolean;
};

export const sellerNavItems: SellerNavItem[] = [
  {
    href: '/seller',
    label: 'Overview',
    description: 'Track performance and next actions',
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    href: '/seller/products',
    label: 'Products',
    description: 'Manage listings and inventory',
    icon: PackageSearch,
  },
  {
    href: '/seller/orders',
    label: 'Orders',
    description: 'Update fulfilment and tracking',
    icon: PackageCheck,
  },
  {
    href: '/seller/reviews',
    label: 'Reviews',
    description: 'Respond to customer feedback',
    icon: Star,
  },
  {
    href: '/seller/payout-settings',
    label: 'Payouts',
    description: 'Configure payout destinations',
    icon: Wallet,
  },
  {
    href: '/seller/analytics',
    label: 'Analytics',
    description: 'Dig into sales and engagement',
    icon: BarChart3,
  },
  {
    href: '/seller/transactions',
    label: 'Transactions',
    description: 'Download financial records',
    icon: Receipt,
  },
];
