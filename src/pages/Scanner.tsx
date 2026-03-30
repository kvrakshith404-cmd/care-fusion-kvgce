import { motion } from "framer-motion";
import { Camera, Pill, FileText, ScanLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const Scanner = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-primary-foreground">Smart Scanner</h1>
          <p className="text-xs text-primary-foreground/70">Scan medicines & prescriptions</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* Scanner Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 flex flex-col items-center"
        >
          <div className="w-full aspect-square max-w-[250px] rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-secondary/30 relative overflow-hidden">
            <ScanLine className="w-12 h-12 text-primary/40 mb-3 animate-float" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Point your camera at a medicine or prescription
            </p>
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-0.5 gradient-primary opacity-40"
            />
          </div>

          <div className="flex gap-3 mt-5 w-full">
            <Button className="flex-1 rounded-full gradient-primary text-primary-foreground">
              <Camera className="w-4 h-4 mr-2" />
              Scan
            </Button>
            <Button variant="outline" className="flex-1 rounded-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-4 text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-2">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Medicine</h3>
            <p className="text-[11px] text-muted-foreground">Identify & learn</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-4 text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Prescription</h3>
            <p className="text-[11px] text-muted-foreground">OCR extract</p>
          </motion.div>
        </div>

        {/* Recent Scans */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Recent Scans</h2>
          <div className="space-y-2">
            {[
              { name: "Paracetamol 500mg", type: "Medicine", time: "Today" },
              { name: "Dr. Smith Prescription", type: "Prescription", time: "Yesterday" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass-card rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  {item.type === "Medicine" ? (
                    <Pill className="w-4 h-4 text-primary" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.type}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
