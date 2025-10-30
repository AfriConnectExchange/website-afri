
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';

const socialLinks = [
  { name: 'Facebook', href: '#', icon: <FacebookIcon className="h-5 w-5" /> },
  { name: 'Twitter', href: '#', icon: <XIcon className="h-5 w-5" /> },
  { name: 'Instagram', href: '#', icon: <InstagramIcon className="h-5 w-5" /> },
  { name: 'LinkedIn', href: '#', icon: <LinkedInIcon className="h-5 w-5" /> },
];

const footerLinks = [
    {
        title: 'Company',
        links: [
            { label: 'About Us', href: '/about' },
            { label: 'Our Sponsors', href: '/sponsors' },
            { label: 'Contact Us', href: '/support' },
        ],
    },
    {
        title: 'How It Works',
        links: [
            { label: 'How to Buy', href: '/help/how-to-buy' },
            { label: 'How to Sell', href: '/help/how-to-sell' },
            { label: 'Buyer Protection (Escrow)', href: '/buyer-protection' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '/help' },
            { label: 'Dispute Resolution', href: '/disputes' },
            { label: 'FAQs', href: '/faq' },
        ],
    },
];


export default function Footer() {
  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container mx-auto px-4 md:px-6 py-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="sm:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-2 text-foreground text-xs">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-[12px] text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Download block placed beside Support links as requested */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground text-xs">Download the Free App</h3>
                <div className="text-[12px] text-muted-foreground mb-2">Get it on</div>
                <div className="flex gap-3 items-center">
                  <a href="#" aria-label="Get it on Google Play">
                    <img src="/google-play.svg" alt="Google Play" className="h-9 md:h-10 w-auto" />
                  </a>
                  <a href="#" aria-label="Download on the App Store">
                    <img src="/app-store.svg" alt="App Store" className="h-9 md:h-10 w-auto" />
                  </a>
                </div>
            </div>
          </div>

          <div className="lg:col-span-1 lg:col-start-4 bg-background p-3 rounded-md border max-w-xs">
            <h3 className="font-semibold text-foreground mb-1 text-xs">Stay Connected</h3>
            <p className="text-[11px] text-muted-foreground mb-2">
              Get the latest updates, promotions, and news from AfriConnect directly to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 items-start">
              <Input
                type="email"
                placeholder="Enter your email"
                className="w-full sm:w-40 text-[11px] py-1 px-2 h-8"
              />
              <Button type="submit" className="text-[11px] py-1 px-3 h-8">Subscribe</Button>
            </form>

            {/* badges moved to the right/social area to avoid mixing CTAs */}
          </div>
        </div>

        <div className="border-t my-6"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[12px]">
        <div className="flex items-center gap-1">
           <Logo withText={false} className="text-foreground" />
           <span className="font-semibold text-foreground text-xs">AfriConnect Exchange</span>
         </div>

          <div className="text-center text-xs text-muted-foreground order-last md:order-none">
            <p className="font-semibold text-foreground/90 text-[11px]">A project of McBenLeo CIC (Company Number: SC859990)</p>
            <a href="mailto:info@africonnect-exchange.org" className="hover:text-primary mt-1 inline-block text-[11px]">info@africonnect-exchange.org</a>
            <div className="mt-2 space-x-3 text-[11px]">
                <Link href="/terms-of-service" className="hover:text-primary">Terms</Link>
                <span>&middot;</span>
                <Link href="/privacy-policy" className="hover:text-primary">Privacy</Link>
                <span>&middot;</span>
                <Link href="/cookie-policy" className="hover:text-primary">Cookies</Link>
            </div>
            <p className="mt-2 text-[11px]">&copy; {new Date().getFullYear()} AfriConnect Exchange. All rights reserved.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} aria-label={link.name} className="text-muted-foreground hover:text-primary text-xs">
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
