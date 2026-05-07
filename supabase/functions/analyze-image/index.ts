import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, type, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langMap: Record<string, string> = { en: "English", hi: "Hindi", kn: "Kannada" };
    const langName = langMap[language] || "English";

    let prompt = "";
    if (type === "prescription") {
      prompt = "You are a medical OCR assistant. Analyze this prescription image and extract: medicine names, dosages, frequency, duration, and any special instructions. Format clearly with bullet points.";
    } else if (type === "injury") {
      prompt = "You are a first-aid and injury assessment assistant. Analyze this injury image and provide: type of injury identified, severity assessment, immediate first-aid steps, what NOT to do, and when to seek emergency care. Format clearly with markdown headers and bullet points.";
    } else if (type === "mood") {
      prompt = "You are a facial emotion classifier. Look at the face in the image and classify the dominant mood. Respond with ONLY ONE of these exact lowercase words and nothing else (no punctuation, no explanation): happy, calm, stressed, sad, angry, tired, loved, sick, excited.";
    } else {
      prompt = "You are a medicine identification assistant. Analyze this medicine image and provide: medicine name, active ingredients, common uses, dosage information, side effects, and precautions. Format clearly with markdown.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt + `\n\nDo not append any medical disclaimer. ALWAYS write the entire response in ${langName}, regardless of any text in the image. Translate all headings, labels, and content into ${langName}.` },
          {
            role: "user",
            content: [
              { type: "text", text: type === "prescription" ? "Please analyze this prescription:" : type === "injury" ? "Please analyze this injury:" : "Please identify this medicine:" },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Could not analyze the image.";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
