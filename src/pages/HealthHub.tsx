import { motion } from "framer-motion";
import { Camera, Brain, FileSearch, Stethoscope, ArrowRight } from "lucide-react";

const hubFeatures = [
  {
    icon: Camera,
    title: "Injury Scanner",
    desc: "Scan an injury with your camera and get AI-powered analysis and first-aid guidance.",
    color: "from-red-500 to-orange-400",
    tag: "AI Vision",
  },
  {
    icon: Brain,
    title: "Symptom Checker",
    desc: "Describe your symptoms and get intelligent health insights powered by AI.",
    color: "from-violet-500 to-purple-400",
    tag: "AI Chat",
  },
  {
    icon: FileSearch,
    title: "Report Analyzer",
    desc: "Upload medical reports and get easy-to-understand summaries.",
    color: "from-blue-500 to-cyan-400",
    tag: "OCR + AI",
  },
  {
    icon: Stethoscope,
    title: "Health Tips",
    desc: "Get personalized daily health tips based on your profile and history.",
    color: "from-emerald-500 to-teal-400",
    tag: "Personalized",
  },
];

const HealthHub = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-primary-foreground">AI Health Hub</h1>
          <p className="text-xs text-primary-foreground/70">Your intelligent health assistant</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {hubFeatures.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card rounded-2xl p-4 cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {feature.tag}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-4 mt-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            ⚠️ AI health features are for informational purposes only. Always consult a qualified healthcare professional for medical advice.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthHub;
