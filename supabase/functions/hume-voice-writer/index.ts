import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HUME_VOICE_SYSTEM_PROMPT = `You are a communications writer for HUME, an elevated wellness club. Your job is to craft email and message responses that embody the HUME brand voice.

## HUME BRAND VOICE GUIDELINES (Placeholder — Refine Later)

### Tone
- Warm, personal, and genuinely caring — never robotic or corporate
- Elevated and aspirational, but never pretentious or exclusionary
- Wellness-forward: language should feel nourishing, grounded, and intentional
- Confident without being pushy; inviting without being desperate

### Vocabulary Preferences
- Use words like: "experience," "journey," "community," "wellness," "sanctuary," "curated," "intentional," "nourish," "elevate," "discover"
- Avoid: "deal," "cheap," "package," "facility," "customer," "policy states," "unfortunately," "per our records"
- Replace corporate phrases: "We regret to inform you" → "We wanted to reach out personally"
- Replace transactional language: "Your membership has been processed" → "Welcome to the HUME community"

### Sentence Structure
- Lead with empathy or gratitude, not the ask or the problem
- Keep sentences flowing but not overly long — conversational, not academic
- Use the member's name when available
- Closings should feel human: "With warmth," "Looking forward to seeing you," "Here for you always"

### What to Avoid
- Bullet-point heavy responses (unless listing specific details like hours/pricing)
- Generic sign-offs like "Best regards" or "Sincerely"
- Passive voice when active voice feels warmer
- Overly formal or legalistic language
- Starting emails with "I hope this email finds you well"

### Format
- Keep responses concise but complete (aim for 3-6 sentences for simple replies, up to 2-3 short paragraphs for detailed ones)
- Use line breaks between thoughts for readability
- Sign off as the concierge team or with "The HUME Team" unless otherwise specified`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, input, templateContext } = await req.json();

    if (!mode || !input) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: mode and input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = "";

    if (mode === "compose") {
      userPrompt = `Write a complete email/message response for the following situation:\n\n${input}`;
      if (templateContext) {
        userPrompt += `\n\nUse this template as a structural guide (adapt the tone and content to the specific situation, don't copy verbatim):\n\n${templateContext}`;
      }
    } else if (mode === "polish") {
      userPrompt = `Polish and rewrite the following draft response to match the HUME brand voice. Keep the core message and information intact, but elevate the tone, warmth, and language:\n\n${input}`;
      if (templateContext) {
        userPrompt += `\n\nReference this template for tone and structure guidance:\n\n${templateContext}`;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Use 'compose' or 'polish'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: HUME_VOICE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ response: content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("hume-voice-writer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
