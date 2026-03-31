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

    // Calculate bounding box from radius
    const latDelta = (radius / 1000) / 111.32;
    const lngDelta = (radius / 1000) / (111.32 * Math.cos((lat * Math.PI) / 180));
    const viewbox = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`;

    // Use Nominatim (free, no key) to search for hospitals nearby
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=hospital&format=json&limit=20&bounded=1&viewbox=${viewbox}` +
      `&addressdetails=1&extratags=1`;

    const resp = await fetch(url, {
      headers: { "User-Agent": "CareFusion/1.0 (health-app)" },
    });

    if (!resp.ok) {
      throw new Error(`Nominatim API returned ${resp.status}`);
    }

    const data = await resp.json();

    const results = (data || []).map((place: any) => ({
      name: place.name || place.display_name?.split(",")[0] || "Hospital",
      vicinity: place.display_name || "",
      rating: 0,
      opening_hours: place.extratags?.opening_hours ? { open_now: true } : null,
      geometry: {
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        },
      },
      phone: place.extratags?.phone || place.extratags?.["contact:phone"] || null,
      website: place.extratags?.website || place.extratags?.["contact:website"] || null,
      emergency: place.extratags?.emergency === "yes",
    }));

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
