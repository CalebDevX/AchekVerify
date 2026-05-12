import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  LogOut,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Platform Stats", href: "/admin", icon: LayoutDashboard },
    { name: "WhatsApp Numbers", href: "/admin/numbers", icon: Phone },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "OTP Logs", href: "/admin/otp-logs", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <div className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">AchekOTP</span>
            <span className="text-xs font-semibold text-destructive">Admin Portal</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard">
            <div className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground mb-6" data-testid="nav-back-user">
              <ArrowLeft className="mr-3 h-5 w-5" />
              User Dashboard
            </div>
          </Link>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Administration
          </div>
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-destructive text-destructive-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-admin-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-destructive-foreground" : "text-muted-foreground"}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout} data-testid="button-admin-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
