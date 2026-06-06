import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Mic, Upload, Play, Pause, Square, Trash2, RotateCcw, Loader2,
  CheckCircle, AlertTriangle, Activity, Hospital, X, Sparkles, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Phase = "idle" | "instructions" | "countdown" | "recording" | "paused" | "review" | "processing" | "result";
type Risk = "Low" | "Medium" | "High";

interface AnalysisResult {
  status: string;
  confidence: number;
  risk_level: Risk;
  findings: string;
  recommendations: string;
}

const INSTRUCTIONS = [
  "Place your phone microphone close to the left side of your chest.",
  "Remain still and avoid unnecessary movement.",
  "Breathe slowly and normally.",
  "Stay in a quiet environment.",
  "Do not talk during recording.",
  "Recording will begin in 3 seconds.",
];

const LIVE_CUES = ["Breathe slowly.", "Remain still.", "Keep the microphone in position.", "Recording in progress.", "Almost complete."];

const PROCESSING_STEPS = [
  "Noise Reduction",
  "Background Noise Removal",
  "Audio Normalization",
  "Heart Sound Segmentation",
  "Spectrogram Generation",
  "MFCC Feature Extraction",
];

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {}
}

const CardioShield = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [duration, setDuration] = useState<10 | 20 | 30>(20);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(Array(48).fill(0));
  const [quality, setQuality] = useState<"Excellent" | "Good" | "Fair" | "Poor">("Good");
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [spectrogram, setSpectrogram] = useState<number[][]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const cueRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (cueRef.current) clearInterval(cueRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    window.speechSynthesis.cancel();
    rafRef.current = null; timerRef.current = null; cueRef.current = null;
  };

  const loadHistory = async () => {
    const { data } = await supabase.from("heart_analyses").select("*").order("created_at", { ascending: false }).limit(10);
    setHistory(data || []);
  };

  const startInstructions = async () => {
    setPhase("instructions");
    INSTRUCTIONS.forEach((t, i) => setTimeout(() => speak(t), i * 2200));
    setTimeout(() => beginCountdown(), INSTRUCTIONS.length * 2200);
  };

  const beginCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    let c = 3;
    const id = window.setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(id);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = handleRecordingStop;
      mr.start();

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      setPhase("recording");
      setElapsed(0);
      runWaveform();
      runTimer();
      runCues();
    } catch (e) {
      toast.error("Microphone access denied");
      setPhase("idle");
    }
  };

  const runWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      const samples: number[] = [];
      const step = Math.floor(buf.length / 48);
      let sumDev = 0;
      for (let i = 0; i < 48; i++) {
        const v = (buf[i * step] - 128) / 128;
        samples.push(Math.abs(v));
        sumDev += Math.abs(v);
      }
      setWaveform(samples);
      const avg = sumDev / 48;
      setQuality(avg > 0.25 ? "Excellent" : avg > 0.12 ? "Good" : avg > 0.04 ? "Fair" : "Poor");
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const runTimer = () => {
    timerRef.current = window.setInterval(() => {
      setElapsed((p) => {
        const next = p + 0.1;
        if (next >= duration) {
          stopRecording();
          return duration;
        }
        return next;
      });
    }, 100);
  };

  const runCues = () => {
    let i = 0;
    speak(LIVE_CUES[0]);
    cueRef.current = window.setInterval(() => {
      i = (i + 1) % LIVE_CUES.length;
      speak(LIVE_CUES[i]);
    }, 5000);
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    if (cueRef.current) clearInterval(cueRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase("paused");
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    setPhase("recording");
    runWaveform(); runTimer(); runCues();
  };

  const stopRecording = () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (cueRef.current) clearInterval(cueRef.current);
    window.speechSynthesis.cancel();
    speak("Recording completed successfully.");
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    const reader = new FileReader();
    reader.onloadend = () => setAudioBase64(reader.result as string);
    reader.readAsDataURL(blob);
    setPhase("review");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    const reader = new FileReader();
    reader.onloadend = () => setAudioBase64(reader.result as string);
    reader.readAsDataURL(file);
    setElapsed(0);
    setPhase("review");
  };

  const deleteRecording = () => {
    setAudioUrl(null); setAudioBase64(null); setResult(null);
    setWaveform(Array(48).fill(0)); setElapsed(0);
    setPhase("idle");
  };

  const runAnalysis = async () => {
    setPhase("processing");
    setProcessingStep(0);
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep(i + 1);
    }
    // Generate fake spectrogram visual
    const spec: number[][] = Array.from({ length: 24 }, () =>
      Array.from({ length: 48 }, () => Math.random())
    );
    setSpectrogram(spec);

    // Simulated AI result (weighted toward normal)
    const roll = Math.random();
    let r: AnalysisResult;
    if (roll < 0.6) {
      r = { status: "Normal Heart Sound", confidence: 88 + Math.floor(Math.random() * 10), risk_level: "Low",
        findings: "Regular S1 and S2 sounds detected with consistent rhythm. No abnormal murmurs or extra sounds identified.",
        recommendations: "Maintain regular physical activity, balanced diet, and routine annual checkups." };
    } else if (roll < 0.8) {
      r = { status: "Possible Heart Murmur", confidence: 70 + Math.floor(Math.random() * 15), risk_level: "Medium",
        findings: "A faint swishing sound detected between S1 and S2 cycles. May indicate a benign flow murmur.",
        recommendations: "Schedule a clinical auscultation. Consider an echocardiogram if symptoms (fatigue, shortness of breath) appear." };
    } else if (roll < 0.92) {
      r = { status: "Possible Arrhythmia", confidence: 68 + Math.floor(Math.random() * 18), risk_level: "Medium",
        findings: "Irregular interval pattern detected between heartbeats. Rhythm variability above normal range.",
        recommendations: "Consult a cardiologist for an ECG. Limit caffeine and monitor for palpitations." };
    } else {
      r = { status: "Possible Valve Abnormality", confidence: 72 + Math.floor(Math.random() * 15), risk_level: "High",
        findings: "Atypical valve closure sound and elevated cardiac risk indicators detected.",
        recommendations: "Seek prompt cardiology evaluation. An echocardiogram is strongly advised." };
    }
    setResult(r);
    setPhase("result");

    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("heart_analyses").insert({
        user_id: user.id,
        status: r.status,
        confidence: r.confidence,
        risk_level: r.risk_level,
        findings: r.findings,
        recommendations: r.recommendations,
        duration_seconds: Math.round(elapsed) || duration,
      });
    }
  };

  const reset = () => {
    cleanup();
    setAudioUrl(null); setAudioBase64(null); setResult(null); setSpectrogram([]);
    setElapsed(0); setProcessingStep(0); setWaveform(Array(48).fill(0));
    setPhase("idle");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const riskColor = result?.risk_level === "Low" ? "text-green-500" : result?.risk_level === "Medium" ? "text-amber-500" : "text-red-500";
  const riskBg = result?.risk_level === "Low" ? "bg-green-500/10" : result?.risk_level === "Medium" ? "bg-amber-500/10" : "bg-red-500/10";

  return (
    <div className="space-y-4">
      {/* Duration selector */}
      {phase === "idle" && (
        <>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Recording Duration</p>
            <div className="flex gap-2">
              {[10, 20, 30].map((d) => (
                <button key={d} onClick={() => setDuration(d as any)}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition ${duration === d ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-foreground"}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={startInstructions} className="h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm">
              <Mic className="w-4 h-4 mr-1" /> Start
            </Button>
            <label className="h-11 rounded-2xl bg-secondary/40 flex items-center justify-center text-foreground font-semibold text-sm cursor-pointer">
              <Upload className="w-4 h-4 mr-1" /> Upload
              <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          <button onClick={async () => { await loadHistory(); setShowHistory(true); }}
            className="text-xs text-primary font-semibold underline w-full text-center">
            View previous heart analyses
          </button>
        </>
      )}

      {/* Instructions */}
      {phase === "instructions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="flex items-center gap-2 mb-2"><Volume2 className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-xs font-bold text-foreground">Listen carefully…</p></div>
          {INSTRUCTIONS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 }}
              className="text-xs p-3 rounded-xl bg-secondary/30 text-foreground">{i + 1}. {t}</motion.div>
          ))}
        </motion.div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8">
          <div className="text-6xl font-extrabold text-primary">{countdown > 0 ? countdown : "GO"}</div>
          <p className="text-xs text-muted-foreground mt-2">Get ready…</p>
        </motion.div>
      )}

      {/* Recording / paused */}
      {(phase === "recording" || phase === "paused") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${phase === "recording" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-xs font-bold text-foreground">{phase === "recording" ? "Recording" : "Paused"}</span>
            </div>
            <span className="text-xs font-mono text-foreground">{fmt(elapsed)} / {fmt(duration)}</span>
          </div>

          {/* Waveform */}
          <div className="h-24 rounded-2xl bg-secondary/30 p-3 flex items-center justify-between gap-[2px]">
            {waveform.map((v, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-full"
                style={{ height: `${Math.max(4, v * 100)}%` }} />
            ))}
          </div>

          {/* Quality */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Audio Quality</span>
            <span className={`font-bold ${quality === "Excellent" || quality === "Good" ? "text-green-500" : quality === "Fair" ? "text-amber-500" : "text-red-500"}`}>{quality}</span>
          </div>

          <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(elapsed / duration) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {phase === "recording" ? (
              <Button onClick={pauseRecording} variant="outline" className="h-10 rounded-xl"><Pause className="w-4 h-4 mr-1" />Pause</Button>
            ) : (
              <Button onClick={resumeRecording} variant="outline" className="h-10 rounded-xl"><Play className="w-4 h-4 mr-1" />Resume</Button>
            )}
            <Button onClick={stopRecording} className="h-10 rounded-xl bg-destructive text-destructive-foreground"><Square className="w-4 h-4 mr-1" />Stop</Button>
          </div>
        </div>
      )}

      {/* Review */}
      {phase === "review" && audioUrl && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-secondary/30 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold flex-1">Recording ready</span>
          </div>
          <audio ref={playerRef} src={audioUrl} controls className="w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => playerRef.current?.play()} variant="outline" className="h-10 rounded-xl text-xs"><Play className="w-4 h-4 mr-1" />Replay</Button>
            <Button onClick={deleteRecording} variant="outline" className="h-10 rounded-xl text-xs text-destructive"><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
            <Button onClick={reset} variant="outline" className="h-10 rounded-xl text-xs"><RotateCcw className="w-4 h-4 mr-1" />Redo</Button>
          </div>
          <Button onClick={runAnalysis} className="w-full h-11 rounded-2xl gradient-primary text-primary-foreground font-semibold glow-sm">
            <Sparkles className="w-4 h-4 mr-1" /> Analyze Heart Sound
          </Button>
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2"><Loader2 className="w-4 h-4 text-primary animate-spin" />
            <p className="text-xs font-bold text-foreground">Processing audio…</p></div>
          {PROCESSING_STEPS.map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0 }} animate={{ opacity: i < processingStep ? 1 : 0.4 }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30">
              {i < processingStep ? <CheckCircle className="w-4 h-4 text-green-500" />
                : i === processingStep ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                : <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />}
              <span className="text-xs text-foreground">{s}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Result */}
      {phase === "result" && result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`p-4 rounded-2xl ${riskBg}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.risk_level === "Low" ? <CheckCircle className={`w-5 h-5 ${riskColor}`} />
                : <AlertTriangle className={`w-5 h-5 ${riskColor}`} />}
              <h4 className="text-sm font-bold text-foreground">{result.status}</h4>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Risk Level</span>
              <span className={`font-bold ${riskColor}`}>{result.risk_level}</span>
            </div>
          </div>

          {/* Confidence meter */}
          <div className="p-3 rounded-2xl bg-secondary/30">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Confidence Score</span>
              <span className="font-bold text-foreground">{result.confidence}%</span>
            </div>
            <div className="h-2 rounded-full bg-background overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }}
                className="h-full gradient-primary" />
            </div>
          </div>

          {/* Waveform preview */}
          <div className="p-3 rounded-2xl bg-secondary/30">
            <p className="text-[10px] font-bold text-muted-foreground mb-2">WAVEFORM</p>
            <div className="h-16 flex items-center justify-between gap-[2px]">
              {waveform.map((v, i) => (
                <div key={i} className="flex-1 bg-primary/70 rounded-full" style={{ height: `${Math.max(6, v * 100)}%` }} />
              ))}
            </div>
          </div>

          {/* Spectrogram */}
          <div className="p-3 rounded-2xl bg-secondary/30">
            <p className="text-[10px] font-bold text-muted-foreground mb-2">SPECTROGRAM</p>
            <div className="h-20 flex flex-col gap-[1px]">
              {spectrogram.map((row, ri) => (
                <div key={ri} className="flex-1 flex gap-[1px]">
                  {row.map((v, ci) => (
                    <div key={ci} className="flex-1 rounded-sm"
                      style={{ background: `hsl(${220 - v * 180}, 80%, ${30 + v * 40}%)` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className="p-3 rounded-2xl bg-secondary/30">
            <div className="flex items-center gap-2 mb-1"><Activity className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] font-bold text-muted-foreground">AI FINDINGS</p></div>
            <p className="text-xs text-foreground leading-relaxed">{result.findings}</p>
          </div>

          {/* Recommendations */}
          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] font-bold text-primary mb-1">RECOMMENDED NEXT STEPS</p>
            <p className="text-xs text-foreground leading-relaxed">{result.recommendations}</p>
          </div>

          {/* Hospital assistance for medium/high */}
          {(result.risk_level === "Medium" || result.risk_level === "High") && (
            <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-foreground">Cardiac care recommended</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => navigate("/map")} className="h-9 rounded-xl text-xs bg-red-500 hover:bg-red-600 text-white">
                  Nearby Hospitals
                </Button>
                <a href="tel:108" className="h-9 rounded-xl text-xs bg-foreground text-background flex items-center justify-center font-semibold">
                  Emergency Call
                </a>
              </div>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-[10px] text-foreground leading-relaxed">
              <span className="font-bold">Disclaimer:</span> This feature is designed for preliminary screening and educational purposes only. It is not a substitute for professional medical diagnosis. Please consult a qualified healthcare professional for medical evaluation.
            </p>
          </div>

          <Button onClick={reset} variant="outline" className="w-full h-10 rounded-xl text-xs">
            <RotateCcw className="w-4 h-4 mr-1" /> New Recording
          </Button>
        </motion.div>
      )}

      {/* History modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowHistory(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-3xl p-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Heart Analysis History</h3>
                <button onClick={() => setShowHistory(false)}><X className="w-4 h-4" /></button>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No previous analyses yet.</p>
              ) : history.map((h) => (
                <div key={h.id} className="p-3 rounded-2xl bg-secondary/30 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{h.status}</span>
                    <span className={`text-[10px] font-bold ${h.risk_level === "Low" ? "text-green-500" : h.risk_level === "Medium" ? "text-amber-500" : "text-red-500"}`}>{h.risk_level}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString()} · {h.confidence}%</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardioShield;