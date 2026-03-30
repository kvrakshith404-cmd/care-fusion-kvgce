import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const moods = [
  { emoji: "😊", label: "Happy", color: "from-yellow-400 to-orange-400" },
  { emoji: "😌", label: "Calm", color: "from-green-400 to-emerald-400" },
  { emoji: "😰", label: "Stressed", color: "from-red-400 to-pink-400" },
  { emoji: "😢", label: "Sad", color: "from-blue-400 to-indigo-400" },
  { emoji: "😤", label: "Angry", color: "from-orange-500 to-red-500" },
  { emoji: "🥱", label: "Tired", color: "from-purple-400 to-violet-400" },
];

const sampleSongs: Record<string, Array<{ name: string; artist: string; lang: string }>> = {
  Happy: [
    { name: "Happy", artist: "Pharrell Williams", lang: "English" },
    { name: "Kal Ho Naa Ho", artist: "Sonu Nigam", lang: "Hindi" },
    { name: "Good Life", artist: "OneRepublic", lang: "English" },
  ],
  Calm: [
    { name: "Weightless", artist: "Marconi Union", lang: "English" },
    { name: "Tum Hi Ho", artist: "Arijit Singh", lang: "Hindi" },
    { name: "River Flows in You", artist: "Yiruma", lang: "Instrumental" },
  ],
  Stressed: [
    { name: "Lofi Chill Beats", artist: "ChilledCow", lang: "Instrumental" },
    { name: "Kun Faya Kun", artist: "A.R. Rahman", lang: "Hindi" },
    { name: "Breathe Me", artist: "Sia", lang: "English" },
  ],
  Sad: [
    { name: "Fix You", artist: "Coldplay", lang: "English" },
    { name: "Channa Mereya", artist: "Arijit Singh", lang: "Hindi" },
    { name: "Someone Like You", artist: "Adele", lang: "English" },
  ],
  Angry: [
    { name: "Calm Down", artist: "Rema", lang: "English" },
    { name: "Lose Yourself", artist: "Eminem", lang: "English" },
    { name: "Believer", artist: "Imagine Dragons", lang: "English" },
  ],
  Tired: [
    { name: "Sleepy Waves", artist: "Nature Sounds", lang: "Instrumental" },
    { name: "Ilahi", artist: "Arijit Singh", lang: "Hindi" },
    { name: "Dream", artist: "Imagine Dragons", lang: "English" },
  ],
};

const Mood = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-primary-foreground">Mood & Music</h1>
          <p className="text-xs text-primary-foreground/70">How are you feeling today?</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* Mood Selector */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Select your mood</h2>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood, i) => (
              <motion.button
                key={mood.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(mood.label)}
                className={`glass-card rounded-2xl p-4 flex flex-col items-center gap-1 transition-all ${
                  selected === mood.label ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-xs font-medium text-foreground">{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Music Recommendations */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                Recommended for "{selected}"
              </h2>
              <div className="space-y-2">
                {sampleSongs[selected]?.map((song, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{song.name}</p>
                      <p className="text-[11px] text-muted-foreground">{song.artist} · {song.lang}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full w-8 h-8">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                🎵 Dynamic Spotify integration coming soon
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Mood;
