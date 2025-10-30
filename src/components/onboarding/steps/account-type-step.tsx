"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "../onboarding-flow";

interface AccountTypeStepProps {
  data: Partial<OnboardingData>;
  onDataChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function AccountTypeStep({ data, onDataChange, onNext, onBack }: AccountTypeStepProps) {
  const isSeller = !!data.isSeller;

  const select = (seller: boolean) => {
    onDataChange({ isSeller: seller });
  };

  return (
    <div style={{ perspective: 1200 }}>
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base sm:text-lg">AE</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold">AfriConnect Exchange</span>
        </div>
  <h1 className="text-xl sm:text-2xl font-semibold mb-2">Welcome — let’s get started</h1>
  <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">Choose whether you'll use AfriConnect to buy, or to sell and manage a shop. You can change this later in your account settings.</p>
      </div>

      <Card className="relative transform-gpu">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => select(false)}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className={`relative flex items-start gap-3 p-4 rounded-lg bg-white shadow transform-gpu transition-colors w-full text-left focus:outline-none ${!isSeller ? 'ring-2 ring-primary text-primary border-0' : 'border border-gray-200 text-foreground'}`}>
              <div className="flex-none w-12 h-12 relative">
                <Image src="/images/buyer-icon.svg" alt="Buyer" fill className="object-contain" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">Buyer</div>
                <div className="text-sm text-muted-foreground mt-1">Browse, buy and save items. No seller tools.</div>
              </div>
              {!isSeller && (
                <div className="ml-auto flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => select(true)}
              whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className={`relative flex items-start gap-3 p-4 rounded-lg bg-white shadow transform-gpu transition-colors w-full text-left focus:outline-none ${isSeller ? 'ring-2 ring-primary text-primary border-0' : 'border border-gray-200 text-foreground'}`}>
              <div className="flex-none w-12 h-12 rounded-full bg-white/60 flex items-center justify-center ring-1 ring-primary/10 text-current">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18v14H3zM7 3h10v4H7z" /></svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">Seller</div>
                <div className="text-sm text-muted-foreground mt-1">Sell items, manage your shop and view orders.</div>
              </div>
              {isSeller && (
                <div className="ml-auto flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
              )}
            </motion.button>
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full flex gap-3">
            {onBack && (
              <Button variant="outline" onClick={onBack}>Back</Button>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="ml-auto">
              <Button onClick={onNext} className="px-6 py-2">
                Continue
              </Button>
            </motion.div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
