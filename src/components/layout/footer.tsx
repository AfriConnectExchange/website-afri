
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
      <div className="container mx-auto px-4 md:px-6 py-12">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="sm:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4 text-foreground">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-background p-6 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest updates, promotions, and news from AfriConnect directly to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <Input type="email" placeholder="Enter your email" className="flex-1" />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>

        <div className="border-t my-8"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
             <Logo withText={false} className="text-foreground" />
             <span className="font-semibold text-foreground">AfriConnect Exchange</span>
          </div>

          <div className="text-center text-xs text-muted-foreground order-last md:order-none">
            <p className="font-semibold text-foreground/90">A project of McBenLeo CIC (Company Number: SC859990)</p>
            <p>4 Orkney Drive, Kilmarnock, KA3 2HP, Scotland</p>
            <div className="mt-1 space-x-3">
                <Link href="/terms-of-service" className="hover:text-primary">Terms</Link>
                <span>&middot;</span>
                <Link href="/privacy-policy" className="hover:text-primary">Privacy</Link>
                <span>&middot;</span>
                <Link href="/cookie-policy" className="hover:text-primary">Cookies</Link>
                 <span>&middot;</span>
                <a href="mailto:info@africonnectexchange.org" className="hover:text-primary">info@africonnectexchange.org</a>
            </div>
            <p className="mt-2">&copy; {new Date().getFullYear()} AfriConnect Exchange. All rights reserved.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} aria-label={link.name} className="text-muted-foreground hover:text-primary">
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
