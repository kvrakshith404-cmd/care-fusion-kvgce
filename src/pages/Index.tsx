import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, Heart, Pill, Calendar, Bell, Shield, Stethoscope, Brain, LogOut, Sparkles, TrendingUp, ChevronRight, MapPin, Navigation } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Stethoscope, label: "AI Diagnosis", desc: "Smart health scan", color: "from-blue-500 to-cyan-400", path: "/health-hub" },
  { icon: Pill, label: "Med Scanner", desc: "Identify medicines", color: "from-emerald-500 to-teal-400", path: "/scanner" },
  { icon: Brain, label: "Mood Track", desc: "Music therapy", color: "from-violet-500 to-purple-400", path: "/mood" },
  { icon: MapPin, label: "Hospitals", desc: "Find nearby", color: "from-red-500 to-pink-400", path: "/map" },
  { icon: Calendar, label: "Reminders", desc: "Never miss a dose", color: "from-pink-500 to-rose-400", path: "/" },
  { icon: Shield, label: "Emergency", desc: "Quick SOS", color: "from-red-500 to-orange-400", path: "/map" },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("User");
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name.split(" ")[0]); });
    supabase.from("mood_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => { if (data) setMoodLogs(data); });
  }, [user]);

  const firstName = displayName || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="gradient-header px-5 pt-11 pb-7 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="absolute bottom-8 -left-12 w-36 h-36 rounded-full bg-white/5" />
        
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center justify-between mb-5"
        >
          <div>
            <p className="text-xs text-primary-foreground/60 font-medium">{greeting} 👋</p>
            <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">{firstName}</h1>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-primary" />
            </div>
            <button onClick={signOut} className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white/12 backdrop-blur-xl rounded-3xl p-5 border border-white/15"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-primary-foreground/60 font-medium mb-1">Today's Health Score</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-primary-foreground">92</span>
                <span className="text-sm text-primary-foreground/50 font-medium">/100</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-300" />
                <span className="text-[11px] text-green-300 font-semibold">+3 from yesterday</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-[5px] border-white/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <motion.circle
                  cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={220}
                  initial={{ strokeDashoffset: 220 }}
                  animate={{ strokeDashoffset: 220 * 0.08 }}
                  transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <Sparkles className="w-6 h-6 text-primary-foreground/80" />
            </div>
          </div>
          <div className="w-full bg-white/15 rounded-full h-1.5 mt-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "92%" }}
              transition={{ delay: 0.5, duration: 1 }}
              className="bg-white/80 rounded-full h-1.5"
            />
          </div>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 px-5 -mt-5">
        {[
          { value: "98%", label: "Accuracy", icon: Heart, color: "text-red-400" },
          { value: "24/7", label: "Available", icon: Bell, color: "text-primary" },
          { value: "50+", label: "Features", icon: Activity, color: "text-accent" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex-1 glass-card rounded-2xl p-3 text-center"
          >
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Find Hospitals Banner */}
      <div className="px-5 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/map")}
          className="relative glass-card-hover rounded-3xl p-4 cursor-pointer overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-red-500/15 to-pink-400/10" />
          <div className="flex items-center gap-3.5 relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center shadow-lg shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">Find Nearby Hospitals</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Real-time location • Ratings • Navigate instantly</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-400/10 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-red-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Quick Actions</h2>
          <span className="text-[11px] text-primary font-semibold">View all</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(feature.path)}
              className="glass-card-hover rounded-2xl p-3 cursor-pointer text-center"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-foreground leading-tight">{feature.label}</h3>
              <p className="text-[9px] text-muted-foreground mt-0.5">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-2.5">
          {(moodLogs.length > 0 ? moodLogs.map((log) => ({
            title: "Mood Check-in",
            desc: `Feeling ${log.mood} ${log.mood === "Happy" ? "😊" : log.mood === "Calm" ? "😌" : log.mood === "Stressed" ? "😰" : "💭"}`,
            time: new Date(log.created_at).toLocaleDateString(),
            icon: Heart,
            gradient: "from-pink-500 to-rose-400",
          })) : [
            { title: "Welcome!", desc: "Start by checking your mood", time: "Now", icon: Sparkles, gradient: "from-primary to-accent" },
          ]).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className="glass-card rounded-2xl p-3.5 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
