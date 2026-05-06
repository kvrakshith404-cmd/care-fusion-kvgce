import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Scanner from "./pages/Scanner";
import Mood from "./pages/Mood";
import HealthHub from "./pages/HealthHub";
import MapView from "./pages/MapView";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import ChatBubble from "./components/ChatBubble";
import { Heart, Shield, Sparkles, Activity } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen gradient-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen w-full lg:flex lg:items-stretch lg:justify-center lg:bg-gradient-to-br lg:from-primary/10 lg:via-background lg:to-accent/10">
      {/* Left decorative panel (desktop only) */}
      {user && (
        <aside className="hidden lg:flex flex-col justify-between w-[28%] xl:w-[30%] p-12 relative overflow-hidden gradient-header text-primary-foreground">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Care Fusion</h1>
                <p className="text-xs text-primary-foreground/70">AI Health Assistant</p>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4">Your health,<br/>reimagined for 2026.</h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-md">
              Smart diagnostics, mood-based therapy, instant emergency response — all in one elegant assistant.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { icon: Sparkles, label: "AI Diagnosis" },
              { icon: Activity, label: "24/7 Available" },
              { icon: Shield, label: "Emergency SOS" },
              { icon: Heart, label: "98% Accuracy" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
                <f.icon className="w-5 h-5 mb-2" />
                <p className="text-sm font-semibold">{f.label}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* App stage */}
      <main className={user
        ? "flex-1 lg:flex-none lg:w-[520px] xl:w-[560px] lg:my-6 lg:mx-auto lg:rounded-[2.5rem] lg:overflow-hidden lg:shadow-2xl lg:border lg:border-white/40 lg:bg-background relative"
        : "w-full"}>
        <Routes>
        <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
        <Route path="/mood" element={<ProtectedRoute><Mood /></ProtectedRoute>} />
        <Route path="/health-hub" element={<ProtectedRoute><HealthHub /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
        </Routes>
        {user && <BottomNav />}
        {user && <ChatBubble />}
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
