import { Home, Pill, Smile, Stethoscope, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/scanner", icon: Pill, label: "Scanner" },
  { path: "/mood", icon: Smile, label: "Mood" },
  { path: "/health-hub", icon: Stethoscope, label: "AI Hub" },
  { path: "/map", icon: MapPin, label: "Map" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 pb-safe" style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(24px) saturate(200%)",
      WebkitBackdropFilter: "blur(24px) saturate(200%)",
    }}>
      <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-[56px] h-[52px] rounded-2xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-2xl gradient-primary opacity-[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`relative transition-all ${isActive ? "scale-110" : ""}`}>
                <tab.icon className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {isActive && (
                  <motion.div
                    layoutId="tab-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </div>
              <span className={`text-[9px] mt-0.5 font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
