import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng, radius = 5000 } = await req.json();
    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "lat and lng required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use OpenStreetMap Overpass API (free, no key needed)
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        relation["amenity"="hospital"](around:${radius},${lat},${lng});
      );
      out center body 20;
    `;

    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!resp.ok) {
      throw new Error(`Overpass API returned ${resp.status}`);
    }

    const data = await resp.json();

    const results = (data.elements || []).map((el: any) => {
      const elLat = el.lat ?? el.center?.lat ?? lat;
      const elLng = el.lon ?? el.center?.lon ?? lng;
      return {
        name: el.tags?.name || el.tags?.["name:en"] || "Hospital",
        vicinity: [el.tags?.["addr:street"], el.tags?.["addr:city"], el.tags?.["addr:state"]]
          .filter(Boolean).join(", ") || el.tags?.address || "",
        rating: 0,
        opening_hours: el.tags?.opening_hours ? { open_now: true } : null,
        geometry: { location: { lat: elLat, lng: elLng } },
        phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
        website: el.tags?.website || el.tags?.["contact:website"] || null,
        emergency: el.tags?.emergency === "yes",
      };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nearby-hospitals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
