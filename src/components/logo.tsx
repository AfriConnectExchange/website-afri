
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
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-primary-foreground" />
      </div>
      {withText && (
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          AfriConnect Exchange
        </h1>
      )}
    </div>
  );
}
