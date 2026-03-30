import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Scanner from "./pages/Scanner";
import Mood from "./pages/Mood";
import HealthHub from "./pages/HealthHub";
import MapView from "./pages/MapView";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import ChatBubble from "./components/ChatBubble";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/health-hub" element={<HealthHub />} />
          <Route path="/map" element={<MapView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
        <ChatBubble />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
