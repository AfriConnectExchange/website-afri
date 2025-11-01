'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  getCookiePreferences,
  saveCookiePreferences,
  defaultCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookies';
import { Cookie, ShieldCheck, BarChart3, Target, Settings as SettingsIcon } from 'lucide-react';

interface CookiePreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function CookiePreferencesModal({
  open,
  onOpenChange,
  onSave,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultCookiePreferences);

  useEffect(() => {
    if (open) {
      // Load current preferences when modal opens
      const current = getCookiePreferences();
      if (current) {
        setPreferences(current);
      } else {
        setPreferences(defaultCookiePreferences);
      }
    }
  }, [open]);

  const handleSave = () => {
    saveCookiePreferences(preferences);
    onSave?.();
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    const allEnabled: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveCookiePreferences(allEnabled);
    onSave?.();
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    saveCookiePreferences(defaultCookiePreferences);
    onSave?.();
    onOpenChange(false);
  };

  const cookieTypes = [
    {
      id: 'essential' as const,
      icon: ShieldCheck,
      title: 'Essential Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      disabled: true,
    },
    {
      id: 'preferences' as const,
      icon: SettingsIcon,
      title: 'Preference Cookies',
      description: 'Remember your settings and preferences like language, region, and display options.',
      disabled: false,
    },
    {
      id: 'analytics' as const,
      icon: BarChart3,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors use our site so we can improve functionality and performance.',
      disabled: false,
    },
    {
      id: 'marketing' as const,
      icon: Target,
      title: 'Marketing Cookies',
      description: 'Used to show you relevant ads and measure the effectiveness of our marketing campaigns.',
      disabled: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">Cookie Preferences</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Manage your cookie settings. We use cookies to improve your experience on our platform.
            You can learn more in our{' '}
            <a href="/cookie-policy" className="text-primary hover:underline" target="_blank">
              Cookie Policy
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {cookieTypes.map((type, index) => (
            <div key={type.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <type.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={type.id} className="text-sm font-semibold cursor-pointer">
                      {type.title}
                    </Label>
                    <Switch
                      id={type.id}
                      checked={preferences[type.id]}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, [type.id]: checked })
                      }
                      disabled={type.disabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                  {type.disabled && (
                    <p className="text-[10px] text-muted-foreground italic">Always enabled</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRejectAll} className="flex-1 sm:flex-none text-xs h-8">
              Reject All
            </Button>
            <Button variant="outline" onClick={handleAcceptAll} className="flex-1 sm:flex-none text-xs h-8">
              Accept All
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full sm:w-auto text-xs h-8">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
