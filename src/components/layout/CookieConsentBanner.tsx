'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, Settings } from 'lucide-react';
import Link from 'next/link';
import { hasUserConsented, acceptAllCookies, rejectOptionalCookies } from '@/lib/cookies';
import { CookiePreferencesModal } from '@/components/layout/CookiePreferencesModal';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = hasUserConsented();
    
    // Show banner after a short delay if no consent recorded
    if (!hasConsented) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }

    // Listen for cookie settings event from footer
    const handleOpenSettings = () => {
      setShowPreferences(true);
    };

    window.addEventListener('openCookieSettings', handleOpenSettings);
    return () => window.removeEventListener('openCookieSettings', handleOpenSettings);
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectOptionalCookies();
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowPreferences(true);
  };

  const handlePreferencesSaved = () => {
    setShowPreferences(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon and Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">We value your privacy</h3>
                <p className="text-xs text-muted-foreground">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <Link href="/cookie-policy" className="text-primary hover:underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto md:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomize}
                className="flex-1 md:flex-none text-xs h-8"
              >
                <Settings className="h-3 w-3 mr-2" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="flex-1 md:flex-none text-xs h-8"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="flex-1 md:flex-none text-xs h-8"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <CookiePreferencesModal
        open={showPreferences}
        onOpenChange={setShowPreferences}
        onSave={handlePreferencesSaved}
      />
    </>
  );
}
