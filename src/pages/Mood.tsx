import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ExternalLink, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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

const songDB: Record<string, Array<{ name: string; artist: string; lang: string; url: string }>> = {
  Happy: [
    { name: "Happy", artist: "Pharrell Williams", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Happy%20Pharrell" },
    { name: "Kal Ho Naa Ho", artist: "Sonu Nigam", lang: "🇮🇳 Hindi", url: "https://open.spotify.com/search/Kal%20Ho%20Naa%20Ho" },
    { name: "Vaathi Coming", artist: "Anirudh", lang: "🇮🇳 Tamil", url: "https://open.spotify.com/search/Vaathi%20Coming" },
    { name: "Good Life", artist: "OneRepublic", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Good%20Life%20OneRepublic" },
  ],
  Calm: [
    { name: "Weightless", artist: "Marconi Union", lang: "🎵 Instrumental", url: "https://open.spotify.com/search/Weightless%20Marconi" },
    { name: "Tum Hi Ho", artist: "Arijit Singh", lang: "🇮🇳 Hindi", url: "https://open.spotify.com/search/Tum%20Hi%20Ho" },
    { name: "River Flows in You", artist: "Yiruma", lang: "🎵 Instrumental", url: "https://open.spotify.com/search/River%20Flows%20Yiruma" },
  ],
  Stressed: [
    { name: "Lofi Chill Beats", artist: "ChilledCow", lang: "🎵 Instrumental", url: "https://open.spotify.com/search/lofi%20chill" },
    { name: "Kun Faya Kun", artist: "A.R. Rahman", lang: "🇮🇳 Hindi", url: "https://open.spotify.com/search/Kun%20Faya%20Kun" },
    { name: "Breathe Me", artist: "Sia", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Breathe%20Me%20Sia" },
  ],
  Sad: [
    { name: "Fix You", artist: "Coldplay", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Fix%20You%20Coldplay" },
    { name: "Channa Mereya", artist: "Arijit Singh", lang: "🇮🇳 Hindi", url: "https://open.spotify.com/search/Channa%20Mereya" },
    { name: "Someone Like You", artist: "Adele", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Someone%20Like%20You" },
  ],
  Angry: [
    { name: "Calm Down", artist: "Rema", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Calm%20Down%20Rema" },
    { name: "Believer", artist: "Imagine Dragons", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Believer%20Imagine%20Dragons" },
  ],
  Tired: [
    { name: "Sleepy Waves", artist: "Nature Sounds", lang: "🎵 Ambient", url: "https://open.spotify.com/search/sleep%20waves" },
    { name: "Dream", artist: "Imagine Dragons", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Dream%20Imagine%20Dragons" },
  ],
  Loved: [
    { name: "Perfect", artist: "Ed Sheeran", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Perfect%20Ed%20Sheeran" },
    { name: "Enna Sona", artist: "Arijit Singh", lang: "🇮🇳 Hindi", url: "https://open.spotify.com/search/Enna%20Sona" },
    { name: "All of Me", artist: "John Legend", lang: "🇺🇸 English", url: "https://open.spotify.com/search/All%20of%20Me" },
  ],
  Sick: [
    { name: "Healing Frequencies", artist: "Meditative Mind", lang: "🎵 Healing", url: "https://open.spotify.com/search/healing%20frequencies" },
    { name: "Here Comes the Sun", artist: "The Beatles", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Here%20Comes%20the%20Sun" },
  ],
  Excited: [
    { name: "Uptown Funk", artist: "Bruno Mars", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Uptown%20Funk" },
    { name: "Don't Stop Me Now", artist: "Queen", lang: "🇺🇸 English", url: "https://open.spotify.com/search/Don't%20Stop%20Me%20Now" },
  ],
};

const Mood = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [songs, setSongs] = useState<typeof songDB["Happy"]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const selectMood = async (key: string) => {
    setSelected(key);
    setSaved(false);
    const enLabel = moodMeta[key].enLabel;
    const allSongs = songDB[enLabel] || [];
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    setSongs(shuffled.slice(0, 4));

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
              <div className="space-y-2">
                {songs.map((song, i) => (
                  <motion.a key={`${song.name}-${i}`} href={song.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="glass-card-hover rounded-2xl p-3.5 flex items-center gap-3 block">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0 shadow-md">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{song.name}</p>
                      <p className="text-[11px] text-muted-foreground">{song.artist} · {song.lang}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Mood;
