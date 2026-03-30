import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, Star, Hospital, Locate, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type HospitalType = {
  name: string;
  dist: string;
  rating: number;
  open: boolean;
  phone: string;
  lat: number;
  lng: number;
};

const defaultHospitals: HospitalType[] = [
  { name: "City General Hospital", dist: "0.8 km", rating: 4.5, open: true, phone: "tel:+1234567890", lat: 0, lng: 0 },
  { name: "LifeCare Medical Center", dist: "1.2 km", rating: 4.8, open: true, phone: "tel:+1234567891", lat: 0, lng: 0 },
  { name: "Apollo Health Clinic", dist: "2.5 km", rating: 4.3, open: false, phone: "tel:+1234567892", lat: 0, lng: 0 },
  { name: "Sunrise Emergency Care", dist: "3.1 km", rating: 4.6, open: true, phone: "tel:+1234567893", lat: 0, lng: 0 },
];

const MapView = () => {
  const [hospitals] = useState<HospitalType[]>(defaultHospitals);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocationError("Location access denied. Showing default hospitals."),
      );
    }
  }, []);

  const openInMaps = (name: string) => {
    const query = encodeURIComponent(name + " hospital near me");
    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
  };

  const openNearbyHospitals = () => {
    const url = userLocation
      ? `https://www.google.com/maps/search/hospitals/@${userLocation.lat},${userLocation.lng},14z`
      : `https://www.google.com/maps/search/hospitals+near+me`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="gradient-header px-5 pt-11 pb-7 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">Nearby Hospitals</h1>
          <p className="text-xs text-primary-foreground/60 font-medium">Find emergency & healthcare near you</p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* Map Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={openNearbyHospitals}
          className="glass-card-hover rounded-3xl overflow-hidden h-44 flex items-center justify-center relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg glow-md animate-pulse-ring">
              <MapPin className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Open Google Maps</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {userLocation ? "📍 Location detected" : "Tap to find hospitals near you"}
            </p>
          </div>
        </motion.div>

        {/* SOS Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.open("tel:911")}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" />
          Emergency SOS — Call 911
        </motion.button>

        {locationError && (
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <Locate className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">{locationError}</p>
          </div>
        )}

        {/* Hospital List */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Nearest Hospitals</h2>
          <button onClick={openNearbyHospitals} className="text-[11px] text-primary font-bold">View all →</button>
        </div>
        <div className="space-y-3">
          {hospitals.map((hospital, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center shrink-0 shadow-md">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{hospital.name}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {hospital.dist}
                    </span>
                    <span className="text-[11px] flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" /> <span className="text-muted-foreground">{hospital.rating}</span>
                    </span>
                    <span className={`text-[11px] flex items-center gap-1 font-semibold ${hospital.open ? "text-green-600" : "text-destructive"}`}>
                      <Clock className="w-3 h-3" /> {hospital.open ? "Open Now" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => openInMaps(hospital.name)} className="flex-1 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold glow-sm">
                  <Navigation className="w-3 h-3 mr-1" /> Navigate
                </Button>
                <Button size="sm" variant="outline" asChild className="h-9 rounded-xl text-xs font-semibold border-primary/20">
                  <a href={hospital.phone}><Phone className="w-3 h-3 mr-1" /> Call</a>
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
