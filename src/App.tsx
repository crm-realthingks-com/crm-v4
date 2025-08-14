
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Leads from "./pages/Leads";
import Meetings from "./pages/Meetings";
import DealsPage from "./pages/DealsPage";
import Feeds from "./pages/Feeds";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useLocation } from "react-router-dom";
import { useState } from "react";

const queryClient = new QueryClient();

// Layout Component for pages with fixed sidebar
const FixedSidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen flex w-full">
      <div className="fixed top-0 left-0 h-full z-50">
        <AppSidebar isFixed={true} isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      </div>
      <main 
        className="flex-1 bg-background transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: sidebarOpen ? '220px' : '60px'
        }}
      >
        {children}
      </main>
    </div>
  );
};

// Regular Layout Component for other pages
const RegularLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Check if current route needs fixed sidebar
  const needsFixedSidebar = ['/contacts', '/leads'].includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (needsFixedSidebar) {
    return (
      <FixedSidebarLayout>
        {children}
      </FixedSidebarLayout>
    );
  }

  return (
    <RegularLayout>
      {children}
    </RegularLayout>
  );
};

// Auth Route Component (redirects if already authenticated)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            } />
            <Route path="/leads" element={
              <ProtectedRoute>
                <Leads />
              </ProtectedRoute>
            } />
            <Route path="/meetings" element={
              <ProtectedRoute>
                <Meetings />
              </ProtectedRoute>
            } />
            <Route path="/deals" element={
              <ProtectedRoute>
                <DealsPage />
              </ProtectedRoute>
            } />
            <Route path="/feeds" element={
              <ProtectedRoute>
                <Feeds />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
