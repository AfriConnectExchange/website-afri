import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface TermsStepProps {
  onBack: () => void;
  onNext: () => void;
  /** Called when user agrees; passes { agreed, document } */
  onAgree?: (data: { agreed: boolean; document?: string | null }) => void;
  isSeller?: boolean;
}

export default function TermsStep({ onBack, onNext, onAgree, isSeller = false }: TermsStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [termsHtml, setTermsHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch the site's Terms of Service HTML and extract only the main content
    // (strip header/footer). We look for common main containers and fall back
    // to the body if nothing is found.
    let mounted = true;
    setLoading(true);
    fetch('/terms-of-service')
      .then((res) => res.text())
      .then((html) => {
        if (!mounted) return;
        try {
          // Parse the fetched HTML and try to extract the main content element.
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const selectors = [
            'main',
            '[role="main"]',
            '#main',
            '.main',
            'article',
          ];

          let mainEl: Element | null = null;
          for (const s of selectors) {
            const found = doc.querySelector(s);
            if (found) {
              mainEl = found;
              break;
            }
          }

          // If we couldn't find a dedicated main element, try to remove
          // header/footer elements and use the remaining body content.
          let fragmentHtml: string;
          if (mainEl) {
            fragmentHtml = mainEl.innerHTML;
          } else {
            // Remove common header/footer nodes to try to avoid rendering them.
            const bodyClone = doc.body.cloneNode(true) as HTMLElement;
            const header = bodyClone.querySelector('header');
            const footer = bodyClone.querySelector('footer');
            if (header) header.remove();
            if (footer) footer.remove();
            // Also remove elements with .site-header / .site-footer if present
            const elHeader = bodyClone.querySelector('.site-header');
            const elFooter = bodyClone.querySelector('.site-footer');
            if (elHeader) elHeader.remove();
            if (elFooter) elFooter.remove();

            fragmentHtml = bodyClone.innerHTML.trim();
          }

          setTermsHtml(fragmentHtml || null);
        } catch (e) {
          // Parsing failed — fall back to rendering the raw HTML so the user
          // can still preview something.
          setTermsHtml(html || null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setTermsHtml(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  const submitAgree = () => {
    const doc = termsHtml ?? null;
    if (onAgree) onAgree({ agreed, document: doc });
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms of Service</CardTitle>
        <CardDescription>Please review the Terms of Service below. Check the box to accept and continue.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-4">Loading terms preview…</div>
        ) : (
          <div className="prose max-h-72 overflow-y-auto border rounded-md p-4 bg-muted">
            {termsHtml ? (
              // Render the site's Terms of Service HTML directly for preview.
              // eslint-disable-next-line react/no-danger
              <div dangerouslySetInnerHTML={{ __html: termsHtml }} />
            ) : (
              <div>
                <h4>Quick summary</h4>
                <p>This document explains your responsibilities as a user of AfriConnect.</p>
                <p className="text-sm text-muted-foreground">For the full terms, visit the <Link href="/terms-of-service" className="underline">Terms of Service</Link> page.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 mt-4">
          <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
          <label htmlFor="agree" className="text-sm">
            {isSeller ? 'I have reviewed the Terms of Service and accept them as a seller.' : 'I have reviewed the Terms of Service and accept them.'}
          </label>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex gap-3">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button className="ml-auto" onClick={submitAgree} disabled={!agreed}>I agree & Continue</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

