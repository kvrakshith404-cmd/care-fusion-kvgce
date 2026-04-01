import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Pill, FileText, ScanLine, Upload, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";

const Scanner = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<"medicine" | "prescription">("medicine");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setSelectedImage(base64);
      setScanning(true);
      setScanResult(null);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-image", {
          body: { image: base64, type: scanType },
        });
        if (error) throw error;
        setScanResult(data.result);
      } catch {
        setScanResult("Unable to analyze the image. Please try again with a clearer photo.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-header px-5 pt-11 pb-7 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">{t("smartScanner")}</h1>
          <p className="text-xs text-primary-foreground/60 font-medium">{t("scannerDesc")}</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          {(["medicine", "prescription"] as const).map((type) => (
            <button key={type} onClick={() => setScanType(type)}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${scanType === type ? "gradient-primary text-primary-foreground shadow-md glow-sm" : "glass-card text-foreground"}`}>
              {type === "medicine" ? t("medicine") : t("prescription")}
            </button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-3xl p-5 flex flex-col items-center">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
          {selectedImage ? (
            <div className="relative w-full">
              <img src={selectedImage} alt="Scan" className="w-full max-h-56 object-contain rounded-2xl" />
              <button onClick={() => { setSelectedImage(null); setScanResult(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/60 flex items-center justify-center">
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center bg-secondary/20 relative overflow-hidden">
              <ScanLine className="w-14 h-14 text-primary/30 mb-3 animate-float" />
              <p className="text-sm text-muted-foreground text-center px-4 font-medium">
                {scanType === "medicine" ? t("scanMedicineLabel") : t("scanPrescription")}
              </p>
              <motion.div animate={{ y: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-4 h-0.5 gradient-primary rounded-full opacity-30" />
            </div>
          )}
          <div className="flex gap-3 mt-5 w-full">
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm">
              <Camera className="w-4 h-4 mr-2" />{selectedImage ? t("retake") : t("scan")}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-12 rounded-2xl font-semibold border-primary/20">
              <Upload className="w-4 h-4 mr-2" />{t("upload")}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {(scanning || scanResult) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card rounded-3xl p-5">
              {scanning ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                  <p className="text-sm font-semibold text-foreground">{t("analyzingWithAI")}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("mayTakeFewSeconds")}</p>
                </div>
              ) : scanResult && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-sm font-bold text-foreground">{t("analysisComplete")}</h3>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground [&>p]:mb-2 [&>ul]:mb-2 [&>h3]:text-foreground [&>h3]:text-sm">
                    <ReactMarkdown>{scanResult}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Pill, title: t("medicineID"), desc: t("identifyPill"), color: "from-emerald-500 to-teal-400" },
            { icon: FileText, title: t("prescriptionOCR"), desc: t("extractTextRx"), color: "from-violet-500 to-purple-400" },
          ].map((opt, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              onClick={() => { setScanType(i === 0 ? "medicine" : "prescription"); fileInputRef.current?.click(); }}
              className="glass-card-hover rounded-2xl p-4 text-center cursor-pointer">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                <opt.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{opt.title}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
