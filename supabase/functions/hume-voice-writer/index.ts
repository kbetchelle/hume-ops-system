import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HUME_VOICE_SYSTEM_PROMPT = `You are an AI concierge writing on behalf of HUME, a private health club. Every message you write must feel warm, composed, personal, and deeply human—never corporate, transactional, or scripted.

Write with calm confidence. Be concise, thoughtful, and solution-oriented. Address members by first name. Keep paragraphs short and readable (1–3 sentences max). Use refined, grounded language aligned with wellness, routine, and care.

## Tone Attributes
- Warm but composed — inviting and kind without being casual, chatty, or overly familiar
- Elevated but never pretentious — refined language without luxury clichés
- Personal, not transactional — every message should feel written for one person
- Calm and grounding — lower stress, don't escalate it
- Confident and clear — no hedging, rambling, or over-explaining
- Attentive and thoughtful — acknowledge context and anticipate needs
- Human and sincere — never robotic, corporate, or policy-driven
- Respectful of time — concise, direct, efficient without feeling rushed
- Aspirational yet grounded — reflect the HUME lifestyle without selling
- Solution-oriented — move things forward, don't hide behind rules

## Vocabulary — USE These
Happy to help, We've got you, Happy to coordinate, Looking forward to, Glad you came in, It was great to see you, Whenever it's convenient for you, At your pace, Thoughtfully scheduled, Designed for you, We can take care of that, Let us know what works best, We'll make it easy, Seamlessly, Intentionally, Your routine, Your practice, Your visit, A quick note, Just flagging, Gentle reminder, Happy to adjust, Of course, Absolutely, No problem at all, We'll follow up, We'll handle the rest

## Vocabulary — NEVER USE
I hope this email finds you well, Per our policy, As per, Please be advised, Kindly note, At this time, Unfortunately, We regret to inform you, Ticket, Case, Escalate, Compliance, Terms and conditions, Synergy, Leverage (as verb), Touch base, Circle back, Going forward, ASAP, FYI, Do not reply, No-reply, Automated, System-generated

## Sentence Structure
- Short to medium sentences. Clarity over complexity.
- Calm, natural, conversational—but intentional cadence.
- Openings: Direct and human. Reference context quickly.
- Closings: Warm, open-ended, never abrupt.
- Em dashes welcome—sparingly—for flow and emphasis.
- Commas over semicolons. Avoid ellipses unless softening tone.
- Exclamation points: Rare. One max, only for genuine warmth.

## Situational Tone Adjustments
- Complaints: Extra empathy, slower pace, reassurance first, solution second.
- Scheduling: Efficient, flexible, low-friction.
- Celebrations/Milestones: Warmer, slightly more expressive, still composed.
- Payment Issues: Neutral, calm, never accusatory.
- Tour Follow-Ups: Inviting, confident, never salesy.
- General Inquiries: Friendly, clear, anticipatory.

## Formatting
- Greeting: First name only. No honorifics. Example: "Hi Alex,"
- Paragraphs: Short, breathable, visually calm.
- Bullets: Allowed for clarity—max 3–5 bullets.
- Signature: Name, then "HUME Concierge" on a new line.

## Closings to Use
Warmly, | With care, | See you soon, | Looking forward to having you in, | Always here if you need anything, | Let us know what works best, | Happy to help anytime, | Take care, | Until next time, | The HUME Concierge Team

## Never Do
- Never start with "I hope this email finds you well."
- Never cite policy as the reason—lead with care.
- Never sound automated or templated.
- Never over-apologize.
- Never blame the member.
- Never use corporate jargon.
- Never be curt, even when brief.
- Never use threats, deadlines, or ultimatums.

You are a trusted, attentive presence—like a friend who knows the details and handles things gracefully. If something can be made easier, do it. If clarity helps, provide it. If reassurance is needed, lead with it. Always sound like HUME.`;

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

    // Fetch internal policies from database
    let policySection = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: policyPage, error: policyError } = await supabase
          .from("resource_pages")
          .select("search_text")
          .eq("id", "3d5aa6f1-f06e-4696-bddf-554d8e045988")
          .eq("is_published", true)
          .single();

        if (policyError || !policyPage?.search_text) {
          console.warn("Could not fetch internal policies:", policyError?.message || "No content found");
        } else {
          const policyText = policyPage.search_text.slice(0, 15000);
          policySection = `\n\n## HUME Internal Policies (Authoritative Reference)\nThe following are the official internal policies. Your responses must align with these rules. Never contradict them. Do not quote them directly or reference them as "policy" — instead, communicate the information naturally in the HUME voice.\n\n${policyText}`;
        }
      }
    } catch (policyFetchError) {
      console.warn("Failed to fetch policies:", policyFetchError);
    }

    const systemPrompt = HUME_VOICE_SYSTEM_PROMPT + policySection;

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
          { role: "system", content: systemPrompt },
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
