import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard/index";
import ApiKeys from "@/pages/dashboard/api-keys";
import Subscription from "@/pages/dashboard/subscription";
import Logs from "@/pages/dashboard/logs";
import Docs from "@/pages/dashboard/docs";
import AdminDashboard from "@/pages/admin/index";
import AdminNumbers from "@/pages/admin/numbers";
import AdminUsers from "@/pages/admin/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <MainLayout>
          <Landing />
        </MainLayout>
      </Route>
      <Route path="/login">
        <MainLayout>
          <Login />
        </MainLayout>
      </Route>
      <Route path="/register">
        <MainLayout>
          <Register />
        </MainLayout>
      </Route>

      {/* User Dashboard Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/api-keys">
        <ProtectedRoute>
          <DashboardLayout>
            <ApiKeys />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/subscription">
        <ProtectedRoute>
          <DashboardLayout>
            <Subscription />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/logs">
        <ProtectedRoute>
          <DashboardLayout>
            <Logs />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/docs">
        <ProtectedRoute>
          <DashboardLayout>
            <Docs />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/numbers">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminNumbers />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <MainLayout>
          <NotFound />
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
