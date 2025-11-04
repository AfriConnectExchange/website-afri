'use client';
import { ShoppingBag, Store, Package, TrendingUp, Shield, Zap } from 'lucide-react';
import { Card3D } from '../ui/card-3d';
import { Button3D } from '../ui/button-3d';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: 'store' | 'package' | 'trending' | 'shield' | 'zap' | 'bag';
  bgColor: string;
  textColor: string;
  action: () => void;
  badge?: string;
}

interface QuickActionsBarProps {
  actions?: QuickAction[];
  onNavigate?: (page: string) => void;
}

const iconMap = {
  store: Store,
  package: Package,
  trending: TrendingUp,
  shield: Shield,
  zap: Zap,
  bag: ShoppingBag,
};

const defaultActions: QuickAction[] = [
  {
    id: 'become-seller',
    title: 'Sell Now',
    description: 'Start earning today',
    icon: 'store',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    action: () => console.log('Become seller'),
    badge: 'Free',
  },
  {
    id: 'free-listings',
    title: 'Free Items',
    description: 'Get freebies',
    icon: 'package',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    action: () => console.log('Free listings'),
  },
  {
    id: 'trending',
    title: 'Trending',
    description: "What's hot now",
    icon: 'trending',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    action: () => console.log('Trending'),
    badge: '🔥',
  },
  {
    id: 'verified',
    title: 'Verified',
    description: 'Trusted sellers',
    icon: 'shield',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    action: () => console.log('Verified sellers'),
  },
];

export function QuickActionsBar({ actions = defaultActions, onNavigate }: QuickActionsBarProps) {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal Scroll */}
      <div className="flex lg:hidden gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-4">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <div key={action.id} className="snap-start shrink-0">
              <Card3D
                onClick={action.action}
                className={cn(
                  'relative cursor-pointer w-40 p-4 border-0 hover:scale-105 active:scale-95 transition-transform',
                  action.bgColor
                )}
              >
                <div className="flex flex-col items-start gap-2">
                  <div className="relative">
                    <div className={cn('p-2 rounded-xl bg-white shadow-sm', action.textColor)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {action.badge && (
                      <span className="absolute -top-1 -right-1 text-xs bg-white rounded-full px-1.5 py-0.5 shadow-sm font-semibold">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={cn('font-bold text-sm', action.textColor)}>{action.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
                  </div>
                </div>
              </Card3D>
            </div>
          );
        })}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <Card3D
              key={action.id}
              onClick={action.action}
              className={cn(
                'relative cursor-pointer p-5 border-0 hover:scale-105 active:scale-95 transition-transform',
                action.bgColor
              )}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={cn('p-3 rounded-xl bg-white shadow-sm', action.textColor)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {action.badge && (
                    <span className="absolute -top-1 -right-1 text-xs bg-white rounded-full px-2 py-0.5 shadow-sm font-semibold">
                      {action.badge}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={cn('font-bold text-base', action.textColor)}>{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{action.description}</p>
                </div>
              </div>
            </Card3D>
          );
        })}
      </div>
    </div>
  );
}
