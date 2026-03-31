import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Brain, FileSearch, Stethoscope, ArrowRight, Send, Loader2, X, Sparkles, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const TIPS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-tips`;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const hubFeatures = [
  { id: "symptoms", icon: Brain, title: "Symptom Checker", desc: "Describe symptoms for AI health insights", color: "from-violet-500 to-purple-400", tag: "AI Chat" },
  { id: "injury", icon: Camera, title: "Injury Scanner", desc: "Upload a photo for first-aid guidance", color: "from-red-500 to-orange-400", tag: "AI Vision" },
  { id: "report", icon: FileSearch, title: "Report Analyzer", desc: "Upload reports for simple summaries", color: "from-blue-500 to-cyan-400", tag: "OCR + AI" },
  { id: "tips", icon: Stethoscope, title: "Health Tips", desc: "Personalized daily wellness tips", color: "from-emerald-500 to-teal-400", tag: "Personalized" },
];

async function streamFromUrl(url: string, body: object, onDelta: (t: string) => void) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok || !resp.body) throw new Error("Failed");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return;
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

const HealthHub = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setInputText("");
    setSelectedImage(null);
  };

  const toggleFeature = (id: string) => {
    if (activeFeature === id) {
      setActiveFeature(null);
      reset();
    } else {
      setActiveFeature(id);
      reset();
    }
  };

  // Symptom Checker
  const analyzeSymptoms = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    let full = "";
    try {
      await streamFromUrl(CHAT_URL, {
        messages: [{ role: "user", content: `I'm experiencing: ${inputText}. Analyze possible causes, recommended actions, and when to see a doctor.` }],
      }, (chunk) => { full += chunk; setResult(full); });
    } catch {
      setResult("Unable to analyze symptoms. Please try again or consult a healthcare professional.");
    } finally {
      setLoading(false);
    }
  };

  // Injury Scanner
  const handleInjuryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setSelectedImage(base64);
      setLoading(true);
      setResult(null);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-image", {
          body: {
            image: base64,
            type: "injury",
          },
        });
        if (error) throw error;
        setResult(data.result);
      } catch {
        setResult("Unable to analyze the injury image. Please try again with a clearer photo.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Report Analyzer
  const analyzeReport = async () => {
    if (!inputText.trim() && !selectedImage) return;
    setLoading(true);
    setResult(null);

    if (selectedImage) {
      // Image-based report
      try {
        const { data, error } = await supabase.functions.invoke("analyze-image", {
          body: { image: selectedImage, type: "prescription" },
        });
        if (error) throw error;
        setResult(data.result);
      } catch {
        setResult("Unable to analyze the report. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Text-based report
      let full = "";
      try {
        await streamFromUrl(TIPS_URL, {
          type: "report",
          context: inputText,
        }, (chunk) => { full += chunk; setResult(full); });
      } catch {
        setResult("Unable to analyze the report text. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Health Tips
  const generateTips = async () => {
    setLoading(true);
    setResult(null);
    let full = "";
    try {
      await streamFromUrl(TIPS_URL, {
        type: "tips",
        context: inputText.trim() || "Generate personalized health tips for today based on general wellness.",
      }, (chunk) => { full += chunk; setResult(full); });
    } catch {
      setResult("Unable to generate health tips right now. Please try again.");
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
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleFeature(feature.id)}
            className={`glass-card-hover rounded-2xl p-4 cursor-pointer ${activeFeature === feature.id ? "ring-2 ring-primary/30" : ""}`}
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
              <ArrowRight className={`w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform ${activeFeature === feature.id ? "rotate-90" : ""}`} />
            </div>
          </motion.div>
        ))}

        {/* ===== SYMPTOM CHECKER ===== */}
        <AnimatePresence>
          {activeFeature === "symptoms" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-3xl p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Describe Your Symptoms</h3>
              </div>
              <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="E.g., I have a headache, slight fever, and body aches for 2 days..."
                className="rounded-2xl bg-secondary/40 border-0 resize-none min-h-[100px] text-sm"
              />
              <Button onClick={analyzeSymptoms} disabled={!inputText.trim() || loading}
                className="w-full mt-3 h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Send className="w-4 h-4 mr-2" /> Analyze Symptoms</>}
              </Button>
              {result && <ResultCard result={result} onClose={reset} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== INJURY SCANNER ===== */}
        <AnimatePresence>
          {activeFeature === "injury" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-3xl p-5 overflow-hidden"
            >
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInjuryUpload} />
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Upload Injury Photo</h3>
              </div>
              {selectedImage ? (
                <div className="relative">
                  <img src={selectedImage} alt="Injury" className="w-full max-h-48 object-contain rounded-2xl" />
                  <button onClick={() => { setSelectedImage(null); setResult(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center bg-secondary/20 cursor-pointer">
                  <Upload className="w-10 h-10 text-primary/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Tap to upload or take photo</p>
                </div>
              )}
              <Button onClick={() => fileInputRef.current?.click()} disabled={loading}
                className="w-full mt-3 h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Camera className="w-4 h-4 mr-2" /> {selectedImage ? "Retake Photo" : "Take Photo"}</>}
              </Button>
              {result && <ResultCard result={result} onClose={reset} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== REPORT ANALYZER ===== */}
        <AnimatePresence>
          {activeFeature === "report" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-3xl p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Analyze Medical Report</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <Button variant={!selectedImage ? "default" : "outline"} size="sm" onClick={() => setSelectedImage(null)}
                  className="rounded-xl text-xs">📝 Paste Text</Button>
                <Button variant={selectedImage ? "default" : "outline"} size="sm"
                  onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e) => handleReportImageUpload(e as any); inp.click(); }}
                  className="rounded-xl text-xs">📸 Upload Image</Button>
              </div>
              {selectedImage ? (
                <div className="relative mb-3">
                  <img src={selectedImage} alt="Report" className="w-full max-h-48 object-contain rounded-2xl" />
                  <button onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : (
                <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your lab report, blood test results, or medical notes here..."
                  className="rounded-2xl bg-secondary/40 border-0 resize-none min-h-[120px] text-sm"
                />
              )}
              <Button onClick={analyzeReport} disabled={(!inputText.trim() && !selectedImage) || loading}
                className="w-full mt-3 h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><FileSearch className="w-4 h-4 mr-2" /> Analyze Report</>}
              </Button>
              {result && <ResultCard result={result} onClose={reset} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== HEALTH TIPS ===== */}
        <AnimatePresence>
          {activeFeature === "tips" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-3xl p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Personalized Health Tips</h3>
              </div>
              <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="Optional: Tell us about yourself (age, conditions, goals) for personalized tips..."
                className="rounded-2xl bg-secondary/40 border-0 resize-none min-h-[80px] text-sm"
              />
              <Button onClick={generateTips} disabled={loading}
                className="w-full mt-3 h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Tips</>}
              </Button>
              {result && <ResultCard result={result} onClose={reset} />}
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

const ResultCard = ({ result, onClose }: { result: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-secondary/30">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <h4 className="text-xs font-bold text-foreground">AI Analysis</h4>
      </div>
      <button onClick={onClose} className="p-1"><X className="w-3 h-3 text-muted-foreground" /></button>
    </div>
    <div className="prose prose-sm max-w-none text-foreground [&>p]:mb-2 [&>ul]:mb-2 [&>h3]:text-sm [&>h3]:font-bold">
      <ReactMarkdown>{result}</ReactMarkdown>
    </div>
  </motion.div>
);

export default HealthHub;
