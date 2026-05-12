import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src="/logo.svg" alt="AchekOTP" className="h-9 w-9" />
              <span className="text-xl font-bold tracking-tight text-gray-900">AchekOTP</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/docs" className="hover:text-gray-900 transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="link-dashboard">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900" data-testid="link-login">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="link-register">Start free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="bg-gray-950 text-gray-400 py-14">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="AchekOTP" className="h-8 w-8" />
                <span className="font-bold text-white text-lg">AchekOTP</span>
              </div>
              <p className="text-sm leading-relaxed">
                Nigeria's most reliable WhatsApp OTP verification API. Built for developers, trusted by businesses.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm">Developers</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><a href="/api/docs" className="hover:text-white transition-colors">API Explorer</a></li>
                <li><a href="/api/openapi.json" className="hover:text-white transition-colors">OpenAPI Spec</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} AchekOTP by <a href="https://achek.com.ng" className="hover:text-white">Achek</a>. All rights reserved.</p>
            <p className="text-sm">Made in Nigeria 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
