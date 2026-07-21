import Link from "next/link";
import { ShoppingBag, Globe, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  product: [
    { label: "Browse Errands", href: "/errands" },
    { label: "Post an Errand", href: "/create" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  company: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
  ],
  support: [
    { label: "Help Center", href: "mailto:support@marketrun.com" },
    { label: "Contact Us", href: "mailto:hello@marketrun.com" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">MarketRun</span>
            </Link>
            <p className="text-sm text-background/70 mb-4 max-w-xs">
              Someone is already at the market. Let them help you shop.
            </p>
            <div className="flex items-center gap-3">
              <Link href="https://twitter.com/marketrun" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background transition-colors">
                <Globe className="w-5 h-5" />
              </Link>
              <Link href="https://github.com/marketrun" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background transition-colors">
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/20" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/70">
            &copy; 2026 MarketRun. All rights reserved.
          </p>
          <p className="text-sm text-background/70">
            Powered by <span className="text-secondary">Monnify</span> for API Conference Lagos 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
