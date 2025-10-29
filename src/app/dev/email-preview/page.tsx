
'use client';

import WelcomeTemplate from '@/components/emails/welcome-template';
import { render } from '@react-email/render';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function EmailPreviewPage() {
  const emailHtml = render(<WelcomeTemplate userName="John Doe" />);
  const router = useRouter();

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
             </Button>
            <div>
                 <h1 className="text-2xl font-bold">Email Template Preview</h1>
                 <p className="text-sm text-muted-foreground">Reviewing the "Welcome" email template.</p>
            </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rendered HTML Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="w-full h-[600px] border rounded-lg overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: emailHtml }}
            />
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>React Component Preview</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="border rounded-lg overflow-hidden">
                <WelcomeTemplate userName="John Doe" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
