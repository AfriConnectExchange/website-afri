'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Gift } from 'lucide-react';
import { Button3D } from '../ui/button-3d';
import { Card3D } from '../ui/card-3d';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PromoBanner {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  bgColor: string;
  icon: 'sparkles' | 'trending' | 'gift';
  image?: string;
}

interface PromotionalBannerProps {
  banners?: PromoBanner[];
  autoPlayInterval?: number;
}

const defaultBanners: PromoBanner[] = [
  {
    id: '1',
    title: '🎉 Flash Sale Today!',
    description: 'Up to 50% off on selected items',
    ctaText: 'Shop Now',
    ctaAction: () => console.log('Flash sale clicked'),
    bgColor: 'from-orange-400 to-pink-500',
    icon: 'sparkles',
  },
  {
    id: '2',
    title: '🚀 New Arrivals',
    description: 'Check out the latest products',
    ctaText: 'Explore',
    ctaAction: () => console.log('New arrivals clicked'),
    bgColor: 'from-blue-400 to-purple-500',
    icon: 'trending',
  },
  {
    id: '3',
    title: '🎁 Free Shipping',
    description: 'On orders over £50',
    ctaText: 'Learn More',
    ctaAction: () => console.log('Free shipping clicked'),
    bgColor: 'from-green-400 to-teal-500',
    icon: 'gift',
  },
];

const iconMap = {
  sparkles: Sparkles,
  trending: TrendingUp,
  gift: Gift,
};

export function PromotionalBanner({
  banners = defaultBanners,
  autoPlayInterval = 5000,
}: PromotionalBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, banners.length, autoPlayInterval]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBanner = banners[currentIndex];
  const Icon = iconMap[currentBanner.icon];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card3D
            className={cn(
              'relative overflow-hidden border-0 bg-gradient-to-br',
              currentBanner.bgColor
            )}
          >
            <div className="relative p-6 sm:p-8 md:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Content */}
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {currentBanner.title}
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-white/90 max-w-md">
                    {currentBanner.description}
                  </p>
                </div>

                {/* CTA Button */}
                <Button3D
                  onClick={currentBanner.ctaAction}
                  className="bg-white text-gray-900 hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.2)] w-full sm:w-auto"
                  size="lg"
                >
                  {currentBanner.ctaText}
                </Button3D>
              </div>

              {/* Decorative circles */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
          </Card3D>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Hidden on mobile */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 active:scale-95"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 active:scale-95"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-1.5 sm:h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-6 sm:w-8 bg-white'
                  : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
