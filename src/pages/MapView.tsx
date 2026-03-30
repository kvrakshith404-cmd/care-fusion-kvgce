import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, Star, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";

const hospitals = [
  { name: "City General Hospital", dist: "0.8 km", rating: 4.5, open: true, phone: "+1-234-567" },
  { name: "LifeCare Medical Center", dist: "1.2 km", rating: 4.8, open: true, phone: "+1-234-568" },
  { name: "Apollo Health Clinic", dist: "2.5 km", rating: 4.3, open: false, phone: "+1-234-569" },
  { name: "Sunrise Emergency Care", dist: "3.1 km", rating: 4.6, open: true, phone: "+1-234-570" },
];

const MapView = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-primary-foreground">Nearby Hospitals</h1>
          <p className="text-xs text-primary-foreground/70">Find healthcare near you</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl overflow-hidden h-48 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted opacity-50" />
          <div className="relative text-center">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-float" />
            <p className="text-sm text-muted-foreground">Map view</p>
            <p className="text-[10px] text-muted-foreground">Google Maps integration coming soon</p>
          </div>
        </motion.div>

        {/* Hospital List */}
        <h2 className="text-base font-semibold text-foreground">Nearest Hospitals</h2>
        <div className="space-y-3">
          {hospitals.map((hospital, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center shrink-0">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{hospital.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {hospital.dist}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" /> {hospital.rating}
                    </span>
                    <span className={`text-[11px] flex items-center gap-1 ${hospital.open ? "text-emerald-600" : "text-destructive"}`}>
                      <Clock className="w-3 h-3" /> {hospital.open ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1 rounded-full gradient-primary text-primary-foreground text-xs">
                  <Navigation className="w-3 h-3 mr-1" /> Navigate
                </Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs">
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
