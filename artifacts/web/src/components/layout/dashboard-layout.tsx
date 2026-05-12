import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  KeyRound, 
  CreditCard, 
  List, 
  BookText, 
  LogOut,
  Settings,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "API Keys", href: "/dashboard/api-keys", icon: KeyRound },
    { name: "Sender Numbers", href: "/dashboard/numbers", icon: Smartphone },
    { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Logs", href: "/dashboard/logs", icon: List },
    { name: "Documentation", href: "/dashboard/docs", icon: BookText },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <div className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <KeyRound className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold">AchekOTP</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link href="/admin">
              <div className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground mt-4" data-testid="nav-admin">
                <Settings className="mr-3 h-5 w-5 text-muted-foreground" />
                Admin Panel
              </div>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 md:hidden">
          <div className="flex items-center">
            <KeyRound className="h-6 w-6 text-primary mr-2" />
            <span className="text-lg font-bold">AchekOTP</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} data-testid="button-mobile-logout">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
