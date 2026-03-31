import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, Star, Hospital, Locate, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type HospitalType = {
  name: string;
  vicinity: string;
  rating: number;
  open: boolean | null;
  lat: number;
  lng: number;
  phone: string | null;
};

const MapView = () => {
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchNearbyHospitals(loc.lat, loc.lng);
        },
        () => {
          setLocationError("Location access denied. Enable location to find hospitals near you.");
          setLoadingHospitals(false);
        },
      );
    } else {
      setLocationError("Geolocation not supported.");
      setLoadingHospitals(false);
    }
  }, []);

  const fetchNearbyHospitals = async (lat: number, lng: number) => {
    setLoadingHospitals(true);
    try {
      const { data, error } = await supabase.functions.invoke("nearby-hospitals", {
        body: { lat, lng, radius: 5000 },
      });
      if (error) throw error;
      if (data?.results) {
        setHospitals(
          data.results.map((p: any) => ({
            name: p.name,
            vicinity: p.vicinity || p.formatted_address || "",
            rating: p.rating || 0,
            open: p.opening_hours?.open_now ?? null,
            lat: p.geometry?.location?.lat || lat,
            lng: p.geometry?.location?.lng || lng,
          }))
        );
      }
    } catch {
      // Fallback: open Google Maps directly
      setLocationError("Could not fetch nearby hospitals. Tap the map to search on Google Maps.");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const getDistance = (hLat: number, hLng: number) => {
    if (!userLocation) return "";
    const R = 6371;
    const dLat = ((hLat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((hLng - userLocation.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLocation.lat * Math.PI) / 180) * Math.cos((hLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  const openNavigate = (lat: number, lng: number, name: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`, "_blank");
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
          <p className="text-xs text-primary-foreground/60 font-medium">
            {userLocation ? "📍 Location detected — showing real results" : "Finding your location..."}
          </p>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* Map Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          onClick={openNearbyHospitals}
          className="glass-card-hover rounded-3xl overflow-hidden h-44 flex items-center justify-center relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg glow-md animate-pulse-ring">
              <MapPin className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Open Google Maps</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <ExternalLink className="w-3 h-3" /> View all hospitals on map
            </p>
          </div>
        </motion.div>

        {/* SOS Button */}
        <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
          onClick={() => window.open("tel:911")}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" /> Emergency SOS — Call 911
        </motion.button>

        {locationError && (
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <Locate className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">{locationError}</p>
          </div>
        )}

        {/* Hospital List */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {loadingHospitals ? "Searching..." : `${hospitals.length} Hospitals Found`}
          </h2>
          <button onClick={openNearbyHospitals} className="text-[11px] text-primary font-bold">View all →</button>
        </div>

        {loadingHospitals ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Finding hospitals near you...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hospitals.map((hospital, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }} className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center shrink-0 shadow-md">
                    <Hospital className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{hospital.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{hospital.vicinity}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {userLocation && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> {getDistance(hospital.lat, hospital.lng)}
                        </span>
                      )}
                      {hospital.rating > 0 && (
                        <span className="text-[11px] flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" /> <span className="text-muted-foreground">{hospital.rating}</span>
                        </span>
                      )}
                      {hospital.open !== null && (
                        <span className={`text-[11px] flex items-center gap-1 font-semibold ${hospital.open ? "text-green-600" : "text-destructive"}`}>
                          <Clock className="w-3 h-3" /> {hospital.open ? "Open Now" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => openNavigate(hospital.lat, hospital.lng, hospital.name)}
                    className="flex-1 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold glow-sm">
                    <Navigation className="w-3 h-3 mr-1" /> Navigate
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}`, "_blank")}
                    className="h-9 rounded-xl text-xs font-semibold border-primary/20">
                    <ExternalLink className="w-3 h-3 mr-1" /> Details
                  </Button>
                </div>
              </motion.div>
            ))}
            {hospitals.length === 0 && !loadingHospitals && !locationError && (
              <div className="glass-card rounded-2xl p-6 text-center">
                <Hospital className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hospitals found nearby. Try searching on Google Maps.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
