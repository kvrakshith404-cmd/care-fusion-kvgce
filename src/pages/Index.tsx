import { motion } from "framer-motion";
import { Activity, Heart, Pill, Calendar, Bell, Shield, Stethoscope, Brain } from "lucide-react";

const features = [
  { icon: Stethoscope, label: "AI Diagnosis", desc: "Smart health scan", color: "from-blue-500 to-cyan-400" },
  { icon: Pill, label: "Med Scanner", desc: "Identify medicines", color: "from-emerald-500 to-teal-400" },
  { icon: Brain, label: "Mood Track", desc: "Music therapy", color: "from-violet-500 to-purple-400" },
  { icon: Activity, label: "Health Hub", desc: "AI-powered care", color: "from-orange-500 to-amber-400" },
  { icon: Calendar, label: "Reminders", desc: "Never miss a dose", color: "from-pink-500 to-rose-400" },
  { icon: Shield, label: "Emergency", desc: "Quick SOS", color: "from-red-500 to-orange-400" },
];

const stats = [
  { value: "98%", label: "Accuracy", icon: Heart },
  { value: "24/7", label: "Available", icon: Bell },
  { value: "50+", label: "Features", icon: Activity },
];

const Index = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8 rounded-b-[2rem]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Care Fusion</h1>
            <p className="text-xs text-primary-foreground/70">Your AI Health Companion</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Health Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
        >
          <p className="text-xs text-primary-foreground/70 mb-1">Today's Health Score</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-primary-foreground">92</span>
            <span className="text-sm text-primary-foreground/80 mb-1">/ 100</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "92%" }}
              transition={{ delay: 0.5, duration: 1 }}
              className="bg-white rounded-full h-2"
            />
          </div>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 px-5 -mt-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex-1 glass-card rounded-2xl p-3 text-center"
          >
            <stat.icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              className="glass-card rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{feature.label}</h3>
              <p className="text-[11px] text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Recent Activity</h2>
        <div className="space-y-2">
          {[
            { title: "Medicine Reminder", desc: "Paracetamol - 2 tablets", time: "2h ago", icon: Pill },
            { title: "Mood Check-in", desc: "Feeling calm 😊", time: "5h ago", icon: Heart },
            { title: "Health Scan", desc: "All vitals normal", time: "1d ago", icon: Activity },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
