import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Brain, FileSearch, Stethoscope, ArrowRight, Send, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const hubFeatures = [
  { icon: Brain, title: "Symptom Checker", desc: "Describe symptoms for AI health insights", color: "from-violet-500 to-purple-400", tag: "AI Chat" },
  { icon: Camera, title: "Injury Scanner", desc: "Upload a photo for first-aid guidance", color: "from-red-500 to-orange-400", tag: "AI Vision" },
  { icon: FileSearch, title: "Report Analyzer", desc: "Upload reports for simple summaries", color: "from-blue-500 to-cyan-400", tag: "OCR + AI" },
  { icon: Stethoscope, title: "Health Tips", desc: "Personalized daily wellness tips", color: "from-emerald-500 to-teal-400", tag: "Personalized" },
];

const HealthHub = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            { role: "user", content: `I'm experiencing the following symptoms: ${symptoms}. Please analyze and provide possible causes, recommended actions, and when to see a doctor.` },
          ],
        },
      });

      if (error) throw error;

      // Read streaming response
      if (data) {
        const text = typeof data === "string" ? data : JSON.stringify(data);
        setResult(text);
      }
    } catch {
      // Fallback: use non-streaming approach
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Analyze these symptoms and provide guidance: ${symptoms}` }],
          }),
        });

        if (!resp.ok || !resp.body) throw new Error("Failed");
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setResult(fullText);
              }
            } catch {}
          }
        }
      } catch {
        setResult("Unable to analyze symptoms right now. Please try again or consult a healthcare professional.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-header px-5 pt-11 pb-7 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">AI Health Hub</h1>
          <p className="text-xs text-primary-foreground/60 font-medium">Intelligent health analysis powered by AI</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {hubFeatures.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveFeature(activeFeature === feature.title ? null : feature.title)}
            className={`glass-card-hover rounded-2xl p-4 cursor-pointer ${activeFeature === feature.title ? "ring-2 ring-primary/30" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0 shadow-md`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{feature.tag}</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
              <ArrowRight className={`w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform ${activeFeature === feature.title ? "rotate-90" : ""}`} />
            </div>
          </motion.div>
        ))}

        {/* Symptom Checker Expanded */}
        <AnimatePresence>
          {activeFeature === "Symptom Checker" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-3xl p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Describe Your Symptoms</h3>
              </div>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="E.g., I have a headache, slight fever, and body aches for 2 days..."
                className="rounded-2xl bg-secondary/40 border-0 resize-none min-h-[100px] text-sm"
              />
              <Button
                onClick={analyzeSymptoms}
                disabled={!symptoms.trim() || loading}
                className="w-full mt-3 h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Analyze Symptoms</>
                )}
              </Button>

              {result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-foreground">AI Analysis</h4>
                    <button onClick={() => { setResult(null); setSymptoms(""); }} className="p-1">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground [&>p]:mb-2 [&>ul]:mb-2 [&>h3]:text-sm [&>h3]:font-bold">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-4 text-center"
        >
          <p className="text-[11px] text-muted-foreground font-medium">
            ⚠️ AI health features are for informational purposes only. Always consult a qualified healthcare professional.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthHub;
