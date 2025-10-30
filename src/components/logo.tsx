
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export function Logo({
  withText = true,
  className,
}: {
  withText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('brand-logo flex items-center gap-2', className)} aria-label="AfriConnect Exchange">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundImage: 'var(--logo-gradient)' }}>
          <Layers className="w-5 h-5 text-white" />
      </div>
      {withText && (
        <h1 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Montserrat, Arial, Helvetica, sans-serif" }}>
          Africonnect Exchange
        </h1>
      )}
    </div>
  );
}
