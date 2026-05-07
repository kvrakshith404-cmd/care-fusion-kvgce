import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, X, CheckCircle, Sparkles, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { songDB, Song } from "@/data/songDatabase";

const moodKeys = ["happy", "calm", "stressed", "sad", "angry", "tired", "loved", "sick", "excited"] as const;

const moodMeta: Record<string, { emoji: string; color: string; bg: string; enLabel: string }> = {
  happy: { emoji: "😊", color: "from-yellow-400 to-orange-400", bg: "bg-yellow-50", enLabel: "Happy" },
  calm: { emoji: "😌", color: "from-green-400 to-emerald-400", bg: "bg-green-50", enLabel: "Calm" },
  stressed: { emoji: "😰", color: "from-red-400 to-pink-400", bg: "bg-red-50", enLabel: "Stressed" },
  sad: { emoji: "😢", color: "from-blue-400 to-indigo-400", bg: "bg-blue-50", enLabel: "Sad" },
  angry: { emoji: "😤", color: "from-orange-500 to-red-500", bg: "bg-orange-50", enLabel: "Angry" },
  tired: { emoji: "🥱", color: "from-purple-400 to-violet-400", bg: "bg-purple-50", enLabel: "Tired" },
  loved: { emoji: "😍", color: "from-pink-400 to-rose-400", bg: "bg-pink-50", enLabel: "Loved" },
  sick: { emoji: "🤒", color: "from-gray-400 to-slate-400", bg: "bg-gray-50", enLabel: "Sick" },
  excited: { emoji: "🥳", color: "from-cyan-400 to-blue-400", bg: "bg-cyan-50", enLabel: "Excited" },
};

const langFilters = [
  { key: "all", label: "allLanguages", emoji: "🌐" },
  { key: "english", label: "english", emoji: "🇺🇸" },
  { key: "hindi", label: "hindi", emoji: "🇮🇳" },
  { key: "kannada", label: "kannada", emoji: "🇮🇳" },
  { key: "marathi", label: "marathi", emoji: "🇮🇳" },
];

const Mood = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [langFilter, setLangFilter] = useState("all");
  const [playing, setPlaying] = useState<Song | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const resolveSeq = useRef(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const selectMood = async (key: string) => {
    setSelected(key);
    setSaved(false);
    const enLabel = moodMeta[key].enLabel;
    const allSongs = songDB[enLabel] || [];
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    setSongs(shuffled);

    if (user) {
      const { error } = await supabase.from("mood_logs").insert({
        user_id: user.id,
        mood: enLabel,
      });
      if (!error) {
        setSaved(true);
        toast({ title: t("moodLogged"), description: t("musicForMood") });
      }
    }
  };

  const filteredSongs = langFilter === "all" ? songs : songs.filter((s) => s.langKey === langFilter);
  const displaySongs = filteredSongs.slice(0, 6);

  // Resolve YouTube video ID via edge function for reliable autoplay
  useEffect(() => {
    if (!playing) {
      setVideoId(null);
      return;
    }
    const seq = ++resolveSeq.current;
    setResolving(true);
    setVideoId(null);
    (async () => {
      try {
        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/yt-resolve?q=${encodeURIComponent(
          `${playing.name} ${playing.artist} audio`,
        )}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        const json = await res.json();
        if (seq !== resolveSeq.current) return;
        setVideoId(json.videoId || null);
      } catch {
        if (seq === resolveSeq.current) setVideoId(null);
      } finally {
        if (seq === resolveSeq.current) setResolving(false);
      }
    })();
  }, [playing]);

  const playSong = (song: Song) => {
    // Force remount even if same song re-tapped
    setPlaying(null);
    setIsPaused(false);
    setTimeout(() => setPlaying(song), 30);
  };

  // Load YouTube IFrame API once
  useEffect(() => {
    if ((window as any).YT) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // Create / replace YT player when videoId changes
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    const create = () => {
      if (cancelled || !ytContainerRef.current) return;
      // Destroy previous
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: any) => {
            try { e.target.playVideo(); } catch {}
            setIsPaused(false);
          },
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === 2) setIsPaused(true);
            else if (e.data === 1) setIsPaused(false);
          },
        },
      });
    };

    const wait = setInterval(() => {
      if ((window as any).YT?.Player) {
        clearInterval(wait);
        create();
      }
    }, 60);

    return () => {
      cancelled = true;
      clearInterval(wait);
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
    };
  }, [videoId]);

  const togglePlay = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isPaused) p.playVideo?.();
    else p.pauseVideo?.();
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-header px-5 pt-11 pb-7 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">{t("moodAndMusic")}</h1>
          <p className="text-xs text-primary-foreground/60 font-medium">{t("howAreYouFeeling")}</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">{t("selectYourMood")}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {moodKeys.map((key, i) => {
              const meta = moodMeta[key];
              return (
                <motion.button key={key} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }} onClick={() => selectMood(key)}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1 transition-all ${
                    selected === key ? `bg-gradient-to-br ${meta.color} shadow-lg scale-105` : "glass-card-hover"
                  }`}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className={`text-[11px] font-bold ${selected === key ? "text-white" : "text-foreground"}`}>{t(key)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-foreground">{t("moodLoggedProfile")}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selected && songs.length > 0 && (
            <motion.div key={selected} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("musicFor")} "{t(selected)}"
              </h2>

              {/* Language Filter */}
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {langFilters.map((lf) => (
                  <button key={lf.key} onClick={() => setLangFilter(lf.key)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      langFilter === lf.key
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}>
                    {lf.emoji} {t(lf.label)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {displaySongs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No songs found for this filter.</p>
                )}
                {displaySongs.map((song, i) => {
                  const isPlaying = playing?.name === song.name && playing?.artist === song.artist;
                  return (
                    <motion.button key={`${song.name}-${i}`} onClick={() => playSong(song)}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className={`w-full rounded-2xl p-3.5 flex items-center gap-3 text-left ${isPlaying ? "glass-card border border-primary/40" : "glass-card-hover"}`}>
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0 shadow-md">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{song.name}</p>
                        <p className="text-[11px] text-muted-foreground">{song.artist} · {song.lang}</p>
                      </div>
                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4 shrink-0" aria-label="Playing">
                          <motion.span className="w-0.5 bg-primary rounded-full" animate={{ height: ["30%", "100%", "30%"] }} transition={{ duration: 0.8, repeat: Infinity }} />
                          <motion.span className="w-0.5 bg-primary rounded-full" animate={{ height: ["100%", "40%", "100%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }} />
                          <motion.span className="w-0.5 bg-primary rounded-full" animate={{ height: ["50%", "90%", "50%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }} />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 text-primary shrink-0 fill-primary" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* In-app player */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-3 right-3 z-50 glass-card rounded-2xl px-3 py-2 shadow-2xl border border-border h-14 flex items-center"
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{playing.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {resolving ? "Loading audio…" : !videoId ? "Couldn't load audio" : `${isPaused ? "Paused" : "Now playing"} · ${playing.artist}`}
                </p>
              </div>
              {resolving ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
              ) : videoId ? (
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition shrink-0"
                  aria-label={isPaused ? "Play" : "Pause"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" /> : <Pause className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />}
                </button>
              ) : null}
              <button onClick={() => setPlaying(null)} className="p-1.5 rounded-full hover:bg-muted shrink-0" aria-label="Close player">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            {/* Hidden YT player (audio-only). Kept off-screen so video never shows. */}
            <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
              <div ref={ytContainerRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mood;
