import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2, Mic, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const EMERGENCY_KEYWORDS = [
  "heart attack", "cardiac arrest", "chest pain", "stroke", "unconscious",
  "not breathing", "can't breathe", "cant breathe", "choking", "bleeding heavily",
  "severe bleeding", "suicide", "overdose", "seizure", "anaphylaxis", "emergency",
  "dying", "collapsed", "drowning", "poisoning", "severe burn",
  "हार्ट अटैक", "दिल का दौरा", "आपातकाल", "बेहोश", "सांस नहीं",
  "ಹೃದಯಾಘಾತ", "ತುರ್ತು", "ಎದೆ ನೋವು",
];

const isEmergency = (text: string) => {
  const t = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
};

const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });

const buildEmergencyMessage = async (): Promise<string> => {
  const loc = await getLocation();
  let hospitalSection = "";
  if (loc) {
    try {
      const { data } = await supabase.functions.invoke("nearby-hospitals", {
        body: { lat: loc.lat, lng: loc.lng, radius: 5000 },
      });
      const results = (data?.results || []).slice(0, 3);
      if (results.length) {
        hospitalSection = "\n\n**🏥 Nearest Hospitals:**\n" + results.map((h: any, i: number) => {
          const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${h.geometry.location.lat},${h.geometry.location.lng}`;
          const phone = h.phone ? ` · [📞 Call](tel:${h.phone})` : "";
          return `${i + 1}. **${h.name}** — [🗺️ Directions](${mapLink})${phone}`;
        }).join("\n");
      }
    } catch {}
    if (!hospitalSection) {
      hospitalSection = `\n\n[🗺️ Open hospitals near me](https://www.google.com/maps/search/hospitals/@${loc.lat},${loc.lng},14z)`;
    }
  } else {
    hospitalSection = `\n\n[🗺️ Search hospitals near me](https://www.google.com/maps/search/hospitals+near+me)`;
  }
  return `🚨 **EMERGENCY DETECTED**\n\n**Call emergency services immediately:**\n- 🇮🇳 India: [📞 112](tel:112) / [108](tel:108)\n- 🇺🇸 US: [📞 911](tel:911)${hospitalSection}`;
};

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");
  const langTag = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-US";

  const speak = (text: string) => {
    if (!voiceOutput || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = text.replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = langTag;
    window.speechSynthesis.speak(u);
  };

  const toggleListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Try Chrome."); return; }
    if (isListening) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = langTag;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(txt);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const toggleVoiceOutput = () => {
    setVoiceOutput((v) => {
      if (v && "speechSynthesis" in window) window.speechSynthesis.cancel();
      return !v;
    });
  };

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (!user) { setMessages([]); return; }
    const loadHistory = async () => {
      const { data } = await supabase.from("chat_history").select("message, role").eq("user_id", user.id).order("created_at", { ascending: true }).limit(50);
      if (data && data.length > 0) {
        setMessages(data.map((d) => ({ role: d.role as "user" | "assistant", content: d.message })));
      } else {
        setMessages([{ role: "assistant", content: "Hi! I'm your Care Fusion AI assistant. How can I help you today?\n\n⚠️ *This is not a medical diagnosis.*" }]);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const saveMessage = async (msg: Message) => { if (!user) return; await supabase.from("chat_history").insert({ user_id: user.id, message: msg.content, role: msg.role }); };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_history").delete().eq("user_id", user.id);
    setMessages([{ role: "assistant", content: t("chatCleared") + "\n\n⚠️ *This is not a medical diagnosis.*" }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) {
      setMessages((prev) => [...prev, { role: "user", content: input.trim() }, { role: "assistant", content: t("signInToUseChat") }]);
      setInput(""); return;
    }
    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages); setInput(""); setIsLoading(true);
    await saveMessage(userMsg);

    // Emergency detection: prepend an emergency card before AI reply
    if (isEmergency(userMsg.content)) {
      const emergencyMsg: Message = { role: "assistant", content: await buildEmergencyMessage() };
      setMessages((prev) => [...prev, emergencyMsg]);
      await saveMessage(emergencyMsg);
    }

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // Only update last message if it's the in-progress assistant stream (matches our current text)
        if (last?.role === "assistant" && last.content === assistantSoFar.slice(0, last.content.length) && assistantSoFar.startsWith(last.content) && last.content !== "" && !last.content.startsWith("🚨")) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        // First chunk or previous last is emergency card → append new assistant message
        if (last?.role === "assistant" && last.content.startsWith("🚨")) {
          return [...prev, { role: "assistant", content: assistantSoFar }];
        }
        if (last?.role === "user") {
          return [...prev, { role: "assistant", content: assistantSoFar }];
        }
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
      });
    };
    try {
      const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ messages: updatedMessages, language }) });
      if (!resp.ok || !resp.body) { const errData = await resp.json().catch(() => ({})); throw new Error(errData.error || "Failed"); }
      const reader = resp.body.getReader(); const decoder = new TextDecoder(); let textBuffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex); textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim(); if (jsonStr === "[DONE]") break;
          try { const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content; if (content) upsertAssistant(content); }
          catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }
      if (assistantSoFar) {
        await saveMessage({ role: "assistant", content: assistantSoFar });
        if (assistantSoFar !== lastSpokenRef.current) {
          lastSpokenRef.current = assistantSoFar;
          speak(assistantSoFar);
        }
      }
    } catch (e: any) { upsertAssistant(t("sorryError") + " " + (e.message || "")); } finally { setIsLoading(false); }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center animate-pulse-glow">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-2 bottom-20 top-16 z-50 flex flex-col rounded-3xl overflow-hidden glass-card shadow-2xl border border-white/40 max-w-lg mx-auto">
            <div className="gradient-primary px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Bot className="w-5 h-5 text-primary-foreground" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-foreground">{t("careFusionAI")}</h3>
                  <p className="text-[10px] text-primary-foreground/70">{user ? t("remembersConversations") : t("signInForMemory")}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={toggleVoiceOutput} title="Toggle voice output" className={`w-8 h-8 rounded-full flex items-center justify-center ${voiceOutput ? "bg-white/40" : "bg-white/20"}`}>
                  {voiceOutput ? <Volume2 className="w-4 h-4 text-primary-foreground" /> : <VolumeX className="w-4 h-4 text-primary-foreground" />}
                </button>
                {user && (<button onClick={clearChat} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Trash2 className="w-4 h-4 text-primary-foreground" /></button>)}
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><X className="w-4 h-4 text-primary-foreground" /></button>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/50">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (<div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-1"><Bot className="w-4 h-4 text-primary-foreground" /></div>)}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "glass-card text-foreground rounded-bl-md"}`}>
                    <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:m-0"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                  {msg.role === "user" && (<div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1"><User className="w-4 h-4 text-secondary-foreground" /></div>)}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary-foreground" /></div>
                  <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border bg-background/80 backdrop-blur-xl">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={user ? t("askAnything") : t("signInToChat")}
                  className="rounded-full bg-secondary/50 border-0 focus-visible:ring-primary" />
                <Button type="button" onClick={toggleListening} size="icon" title="Voice input" className={`rounded-full shrink-0 ${isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "gradient-primary"}`}>
                  <Mic className="w-4 h-4" />
                </Button>
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-full gradient-primary shrink-0"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBubble;
