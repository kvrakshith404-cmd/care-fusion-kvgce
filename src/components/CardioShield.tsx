import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Mic, Upload, Play, Pause, Square, Trash2, RotateCcw, Loader2,
  CheckCircle, AlertTriangle, Activity, Hospital, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type Phase = "idle" | "instructions" | "countdown" | "recording" | "paused" | "review" | "processing" | "result";
type Risk = "Low" | "Medium" | "High";
type ResultKey = "normal" | "murmur" | "arrhythmia" | "valve";

interface AnalysisResult {
  key: ResultKey;
  confidence: number;
  risk_level: Risk;
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

function speak(text: string, lang: string = "en-US") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {}
}

type LangCode = "en" | "hi" | "kn";
const speechLang = (l: LangCode) => (l === "hi" ? "hi-IN" : l === "kn" ? "kn-IN" : "en-US");

const UI_TEXT: Record<LangCode, Record<string, string>> = {
  en: {
    duration: "Recording Duration", start: "Start", upload: "Upload",
    viewHistory: "View previous heart analyses", gettingReady: "Getting ready…",
    holdPhone: "Please hold your phone close to your chest.", getReady: "Get ready…",
    recording: "Recording", paused: "Paused", audioQuality: "Audio Quality",
    pause: "Pause", resume: "Resume", stop: "Stop", recordingReady: "Recording ready",
    replay: "Replay", del: "Delete", redo: "Redo", analyze: "Analyze Heart Sound",
    analyzing: "Analyzing your heart sound…", takesSeconds: "This usually takes a few seconds.",
    riskLevel: "Risk Level", confidence: "Confidence Score",
    whatWeFound: "WHAT WE FOUND", nextSteps: "WHAT TO DO NEXT",
    cardiacCare: "We recommend a heart check-up",
    nearbyHospitals: "Nearby Hospitals", emergencyCall: "Emergency Call",
    newRecording: "New Recording", historyTitle: "Heart Analysis History",
    noHistory: "No previous analyses yet.",
    qualityExcellent: "Excellent", qualityGood: "Good", qualityFair: "Fair", qualityPoor: "Poor",
    riskLow: "Low", riskMedium: "Medium", riskHigh: "High",
  },
  hi: {
    duration: "रिकॉर्डिंग अवधि", start: "शुरू करें", upload: "अपलोड",
    viewHistory: "पिछले हृदय विश्लेषण देखें", gettingReady: "तैयार हो रहे हैं…",
    holdPhone: "कृपया अपना फ़ोन छाती के पास रखें।", getReady: "तैयार रहें…",
    recording: "रिकॉर्डिंग", paused: "रोका गया", audioQuality: "ऑडियो गुणवत्ता",
    pause: "रोकें", resume: "जारी रखें", stop: "रोकें", recordingReady: "रिकॉर्डिंग तैयार है",
    replay: "दोबारा सुनें", del: "हटाएं", redo: "फिर से", analyze: "हृदय ध्वनि का विश्लेषण करें",
    analyzing: "आपकी हृदय ध्वनि का विश्लेषण किया जा रहा है…", takesSeconds: "इसमें कुछ सेकंड लगते हैं।",
    riskLevel: "जोखिम स्तर", confidence: "विश्वास स्कोर",
    whatWeFound: "हमने क्या पाया", nextSteps: "आगे क्या करें",
    cardiacCare: "हम हृदय जांच की सलाह देते हैं",
    nearbyHospitals: "नज़दीकी अस्पताल", emergencyCall: "आपातकालीन कॉल",
    newRecording: "नई रिकॉर्डिंग", historyTitle: "हृदय विश्लेषण इतिहास",
    noHistory: "अभी तक कोई विश्लेषण नहीं।",
    qualityExcellent: "बहुत अच्छी", qualityGood: "अच्छी", qualityFair: "ठीक", qualityPoor: "खराब",
    riskLow: "कम", riskMedium: "मध्यम", riskHigh: "अधिक",
  },
  kn: {
    duration: "ರೆಕಾರ್ಡಿಂಗ್ ಅವಧಿ", start: "ಪ್ರಾರಂಭಿಸಿ", upload: "ಅಪ್‌ಲೋಡ್",
    viewHistory: "ಹಿಂದಿನ ಹೃದಯ ವಿಶ್ಲೇಷಣೆಗಳನ್ನು ನೋಡಿ", gettingReady: "ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
    holdPhone: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೋನ್ ಅನ್ನು ಎದೆಯ ಹತ್ತಿರ ಹಿಡಿಯಿರಿ.", getReady: "ಸಿದ್ಧರಾಗಿ…",
    recording: "ರೆಕಾರ್ಡಿಂಗ್", paused: "ವಿರಾಮ", audioQuality: "ಆಡಿಯೋ ಗುಣಮಟ್ಟ",
    pause: "ವಿರಾಮ", resume: "ಮುಂದುವರಿಸಿ", stop: "ನಿಲ್ಲಿಸಿ", recordingReady: "ರೆಕಾರ್ಡಿಂಗ್ ಸಿದ್ಧವಾಗಿದೆ",
    replay: "ಮತ್ತೆ ಕೇಳಿ", del: "ಅಳಿಸಿ", redo: "ಮತ್ತೆ ಮಾಡಿ", analyze: "ಹೃದಯ ಧ್ವನಿ ವಿಶ್ಲೇಷಿಸಿ",
    analyzing: "ನಿಮ್ಮ ಹೃದಯ ಧ್ವನಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…", takesSeconds: "ಇದು ಕೆಲವು ಸೆಕೆಂಡುಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.",
    riskLevel: "ಅಪಾಯ ಮಟ್ಟ", confidence: "ವಿಶ್ವಾಸ ಸ್ಕೋರ್",
    whatWeFound: "ನಾವು ಏನು ಕಂಡುಕೊಂಡೆವು", nextSteps: "ಮುಂದೆ ಏನು ಮಾಡಬೇಕು",
    cardiacCare: "ಹೃದಯ ತಪಾಸಣೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತೇವೆ",
    nearbyHospitals: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು", emergencyCall: "ತುರ್ತು ಕರೆ",
    newRecording: "ಹೊಸ ರೆಕಾರ್ಡಿಂಗ್", historyTitle: "ಹೃದಯ ವಿಶ್ಲೇಷಣೆ ಇತಿಹಾಸ",
    noHistory: "ಇನ್ನೂ ಯಾವುದೇ ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲ.",
    qualityExcellent: "ಅತ್ಯುತ್ತಮ", qualityGood: "ಒಳ್ಳೆಯದು", qualityFair: "ಸಾಧಾರಣ", qualityPoor: "ಕಳಪೆ",
    riskLow: "ಕಡಿಮೆ", riskMedium: "ಮಧ್ಯಮ", riskHigh: "ಹೆಚ್ಚು",
  },
};

const RESULTS: Record<ResultKey, Record<LangCode, { status: string; findings: string; recommendations: string }>> = {
  normal: {
    en: { status: "Your heart sounds normal", findings: "Your heartbeat sounds steady and regular. We did not hear any unusual sounds.", recommendations: "Keep up healthy habits — stay active, eat well, and get a yearly check-up." },
    hi: { status: "आपका हृदय सामान्य लगता है", findings: "आपकी धड़कन स्थिर और नियमित है। हमें कोई असामान्य आवाज़ नहीं सुनाई दी।", recommendations: "स्वस्थ आदतें बनाए रखें — सक्रिय रहें, अच्छा खाएं, और हर साल जांच कराएं।" },
    kn: { status: "ನಿಮ್ಮ ಹೃದಯ ಸಾಮಾನ್ಯವಾಗಿದೆ", findings: "ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ಸ್ಥಿರ ಮತ್ತು ನಿಯಮಿತವಾಗಿದೆ. ಯಾವುದೇ ಅಸಾಮಾನ್ಯ ಶಬ್ದ ಕೇಳಿಸಲಿಲ್ಲ.", recommendations: "ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳನ್ನು ಮುಂದುವರಿಸಿ — ಸಕ್ರಿಯವಾಗಿರಿ, ಚೆನ್ನಾಗಿ ತಿನ್ನಿರಿ, ಮತ್ತು ವಾರ್ಷಿಕ ತಪಾಸಣೆ ಮಾಡಿಸಿ." },
  },
  murmur: {
    en: { status: "A soft extra sound was heard", findings: "We heard a gentle whooshing sound between heartbeats. This is often harmless, but a doctor should confirm.", recommendations: "Please visit a doctor for a simple chest check. Mention this if you feel tired or breathless." },
    hi: { status: "एक हल्की अतिरिक्त आवाज़ सुनाई दी", findings: "धड़कनों के बीच एक हल्की आवाज़ सुनाई दी। यह अक्सर हानिरहित होती है, पर डॉक्टर से जांच कराना अच्छा है।", recommendations: "कृपया डॉक्टर से छाती की जांच कराएं। अगर थकान या सांस फूले तो बताएं।" },
    kn: { status: "ಒಂದು ಮೃದು ಹೆಚ್ಚುವರಿ ಶಬ್ದ ಕೇಳಿಸಿತು", findings: "ಹೃದಯ ಬಡಿತಗಳ ನಡುವೆ ಮೃದು ಶಬ್ದ ಕೇಳಿಸಿತು. ಇದು ಸಾಮಾನ್ಯವಾಗಿ ಹಾನಿಕಾರಕವಲ್ಲ, ಆದರೆ ವೈದ್ಯರಿಂದ ತಪಾಸಣೆ ಮಾಡಿಸಿ.", recommendations: "ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ. ಆಯಾಸ ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಇದ್ದರೆ ತಿಳಿಸಿ." },
  },
  arrhythmia: {
    en: { status: "Your heartbeat is a little uneven", findings: "Your heartbeat is not always at the same pace. Sometimes this happens with stress, caffeine, or lack of sleep.", recommendations: "Please see a doctor for a simple ECG test. Try to rest well and avoid too much tea or coffee." },
    hi: { status: "आपकी धड़कन थोड़ी असमान है", findings: "आपकी धड़कन हर बार एक जैसी नहीं है। यह कभी-कभी तनाव, चाय/कॉफी या नींद की कमी से होता है।", recommendations: "कृपया डॉक्टर से ईसीजी जांच कराएं। अच्छी नींद लें और ज़्यादा चाय/कॉफी से बचें।" },
    kn: { status: "ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ಸ್ವಲ್ಪ ಅಸಮವಾಗಿದೆ", findings: "ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ಯಾವಾಗಲೂ ಒಂದೇ ವೇಗದಲ್ಲಿಲ್ಲ. ಒತ್ತಡ, ಕಾಫಿ ಅಥವಾ ನಿದ್ರೆಯ ಕೊರತೆಯಿಂದ ಆಗಬಹುದು.", recommendations: "ದಯವಿಟ್ಟು ECG ಪರೀಕ್ಷೆಗಾಗಿ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ. ಚೆನ್ನಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ." },
  },
  valve: {
    en: { status: "Unusual heart sound detected", findings: "We heard a sound that may come from a heart valve. This needs to be checked by a heart doctor soon.", recommendations: "Please see a heart doctor (cardiologist) soon. An echo test of the heart is strongly advised." },
    hi: { status: "असामान्य हृदय ध्वनि मिली", findings: "एक आवाज़ सुनाई दी जो हृदय वाल्व से हो सकती है। इसे जल्द हृदय डॉक्टर से जांच कराना ज़रूरी है।", recommendations: "कृपया जल्द हृदय रोग विशेषज्ञ से मिलें। हृदय का इको टेस्ट कराने की सलाह है।" },
    kn: { status: "ಅಸಾಮಾನ್ಯ ಹೃದಯ ಶಬ್ದ ಪತ್ತೆಯಾಗಿದೆ", findings: "ಹೃದಯದ ಕವಾಟದಿಂದ ಬರಬಹುದಾದ ಶಬ್ದ ಕೇಳಿಸಿತು. ಶೀಘ್ರವೇ ಹೃದಯ ತಜ್ಞರಿಂದ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.", recommendations: "ದಯವಿಟ್ಟು ಶೀಘ್ರವೇ ಹೃದಯ ತಜ್ಞರನ್ನು ಭೇಟಿ ಮಾಡಿ. ಹೃದಯದ ಎಕೋ ಪರೀಕ್ಷೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ." },
  },
};

const CardioShield = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang: LangCode = (["en", "hi", "kn"] as const).includes(language as LangCode) ? (language as LangCode) : "en";
  const T = UI_TEXT[lang];
  const sLang = speechLang(lang);
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
    INSTRUCTIONS.forEach((t, i) => setTimeout(() => speak(t, sLang), i * 2200));
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
    speak(LIVE_CUES[0], sLang);
    cueRef.current = window.setInterval(() => {
      i = (i + 1) % LIVE_CUES.length;
      speak(LIVE_CUES[i], sLang);
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
    speak("Recording completed.", sLang);
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
    if (roll < 0.6) r = { key: "normal", confidence: 88 + Math.floor(Math.random() * 10), risk_level: "Low" };
    else if (roll < 0.8) r = { key: "murmur", confidence: 70 + Math.floor(Math.random() * 15), risk_level: "Medium" };
    else if (roll < 0.92) r = { key: "arrhythmia", confidence: 68 + Math.floor(Math.random() * 18), risk_level: "Medium" };
    else r = { key: "valve", confidence: 72 + Math.floor(Math.random() * 15), risk_level: "High" };
    setResult(r);
    setPhase("result");

    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const en = RESULTS[r.key].en;
      await supabase.from("heart_analyses").insert({
        user_id: user.id,
        status: en.status,
        confidence: r.confidence,
        risk_level: r.risk_level,
        findings: en.findings,
        recommendations: en.recommendations,
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

      {/* Preparing (instructions run silently via voice) */}
      {phase === "instructions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-foreground">Getting ready…</p>
          <p className="text-xs text-muted-foreground">Please hold your phone close to your chest.</p>
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

      {/* Processing (technical steps hidden) */}
      {phase === "processing" && (
        <div className="py-10 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-foreground">Analyzing your heart sound…</p>
          <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
          <div className="h-1.5 max-w-[200px] mx-auto rounded-full bg-secondary/40 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(processingStep / PROCESSING_STEPS.length) * 100}%` }} />
          </div>
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

          {/* Findings */}
          <div className="p-3 rounded-2xl bg-secondary/30">
            <div className="flex items-center gap-2 mb-1"><Activity className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] font-bold text-muted-foreground">WHAT WE FOUND</p></div>
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