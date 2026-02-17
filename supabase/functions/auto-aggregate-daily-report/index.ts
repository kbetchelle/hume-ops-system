/**
 * auto-aggregate-daily-report: Aggregate all data sources into daily_reports.
 * Sources: Arketa reservations, Arketa payments, Toast POS, Calendly tours, Open-Meteo weather,
 * daily_report_history (concierge shifts), class schedule from arketa_reservations_history.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  date?: string;
  start_date?: string;
  end_date?: string;
  sync_source?: "auto" | "manual";
}

function isGymCheckin(className: string | null): boolean {
  return (className ?? "").toLowerCase().trim() === "gym check in";
}

function isPrivateAppointment(className: string | null): boolean {
  const n = (className ?? "").toLowerCase();
  return n.includes("personal training") || n.includes("duo training");
}

function mergeTextFields(existing: { text?: string }[], newItems: { text?: string }[]): { text: string }[] {
  const combined = [...existing, ...newItems];
  const texts = combined.map((item) => (typeof item === "string" ? item : item?.text ?? "")).filter(Boolean);
  const unique = [...new Set(texts)];
  return unique.map((text) => ({ text }));
}

const MEMBERSHIP_KEYWORDS = ["membership", "subscription", "monthly", "annual", "dues"];

function isMembershipPayment(offeringName: string[] | null): boolean {
  if (!offeringName || !Array.isArray(offeringName)) return false;
  const joined = offeringName.join(" ").toLowerCase();
  return MEMBERSHIP_KEYWORDS.some((k) => joined.includes(k));
}

/** Fetch weather from Open-Meteo for a date (LA area). */
async function fetchWeather(date: string): Promise<{ temp: string; condition: string } | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=34.0522&longitude=-118.2437&daily=temperature_2m_max,weathercode&timezone=America/Los_Angeles&start_date=${date}&end_date=${date}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const daily = data?.daily;
    if (!daily || !daily.time?.[0]) return null;
    const tempC = daily.temperature_2m_max?.[0];
    const code = daily.weathercode?.[0] ?? 0;
    const tempF = tempC != null ? Math.round((tempC * 9) / 5 + 32) : null;
    const conditions: Record<number, string> = {
      0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
      45: "Foggy", 48: "Foggy", 51: "Drizzle", 61: "Rain", 63: "Rain",
      80: "Showers", 95: "Thunderstorm", 96: "Thunderstorm",
    };
    const condition = conditions[code] ?? "Unknown";
    return { temp: tempF != null ? `${tempF}°F` : "—", condition };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const syncSource = body.sync_source ?? "manual";

    const today = new Date().toISOString().slice(0, 10);
    let dates: string[] = [];
    if (body.date) {
      dates = [body.date];
    } else if (body.start_date && body.end_date) {
      const start = new Date(body.start_date);
      const end = new Date(body.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }
    } else {
      dates = [today];
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of dates) {
      if (!dateRe.test(d)) {
        return new Response(
          JSON.stringify({ success: false, error: `Invalid date: ${d}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const results: { date: string; report: unknown; data_sources: unknown }[] = [];

    for (const report_date of dates) {
      const dataSources: Record<string, unknown> = {};

      // 1) Arketa reservations
      const { data: resRows, error: resErr } = await supabase
        .from("arketa_reservations_history")
        .select("class_id, class_date, class_name, status, checked_in")
        .eq("class_date", report_date)
        .not("class_date", "is", null);

      if (resErr) {
        return new Response(
          JSON.stringify({ success: false, error: resErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalGymCheckins = 0;
      let totalClassCheckins = 0;
      let privateAppointments = 0;
      let totalReservations = (resRows ?? []).length;
      let totalCancellations = 0;
      let totalNoShows = 0;
      let totalWaitlisted = 0;
      let checkedInCount = 0;

      const classCounts: Record<string, { name: string; signups: number; waitlist: number }> = {};

      for (const r of resRows ?? []) {
        const className = (r.class_name as string) ?? "";
        const status = (r.status as string) ?? "";
        const checkedIn = r.checked_in === true;
        if (status === "cancelled") totalCancellations++;
        else if (status === "no_show") totalNoShows++;
        else if (status === "waitlisted") totalWaitlisted++;
        if (checkedIn) checkedInCount++;

        const key = `${r.class_id ?? ""}-${className}`;
        if (!classCounts[key]) classCounts[key] = { name: className, signups: 0, waitlist: 0 };
        if (status === "waitlisted") classCounts[key].waitlist++;
        else classCounts[key].signups++;

        if (!checkedIn) continue;

        if (isGymCheckin(className)) totalGymCheckins++;
        else if (isPrivateAppointment(className)) privateAppointments++;
        else totalClassCheckins++;
      }

      const attendanceRate =
        totalReservations > 0 ? Math.round((checkedInCount / totalReservations) * 10000) / 100 : null;

      dataSources.arketa_reservations = {
        count: resRows?.length ?? 0,
        gym: totalGymCheckins,
        class: totalClassCheckins,
        private: privateAppointments,
      };

      // 2) Arketa payments (amount in cents -> dollars; use offering_name for membership vs other)
      const { data: payRows, error: payErr } = await supabase
        .from("arketa_payments_staging")
        .select("amount, offering_name, created_at_api")
        .not("amount", "is", null);

      if (payErr) {
        return new Response(
          JSON.stringify({ success: false, error: payErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let grossSalesMembership = 0;
      let grossSalesOther = 0;
      for (const p of payRows ?? []) {
        const apiDate = (p.created_at_api as string)?.slice(0, 10);
        if (apiDate !== report_date) continue;
        const cents = Number(p.amount ?? 0);
        const dollars = cents / 100;
        if (isMembershipPayment(p.offering_name as string[] | null)) grossSalesMembership += dollars;
        else grossSalesOther += dollars;
      }
      const grossSalesArketa = grossSalesMembership + grossSalesOther;
      dataSources.arketa_payments = { count: payRows?.length ?? 0, total: grossSalesArketa };

      // 3) Toast POS (net_sales per order, sum by business_date)
      const { data: toastRows, error: toastErr } = await supabase
        .from("toast_staging")
        .select("business_date, net_sales, gross_sales")
        .eq("business_date", report_date);

      let cafeSales = 0;
      if (!toastErr && toastRows?.length) {
        cafeSales = (toastRows as { net_sales?: number }[]).reduce((sum, row) => sum + Number(row.net_sales ?? 0), 0);
      }
      dataSources.toast_staging = { status: toastErr ? "error" : "ok", cafe_sales: cafeSales };

      // 4) Calendly / scheduled_tours
      const { data: tourRows } = await supabase
        .from("scheduled_tours")
        .select("guest_name, guest_email, start_time")
        .eq("tour_date", report_date)
        .eq("status", "active");

      const tourLines = (tourRows ?? []).map((t) => {
        const name = (t.guest_name as string) ?? "Guest";
        const email = (t.guest_email as string) ?? "";
        const start = (t.start_time as string) ? new Date(t.start_time as string).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
        return `${name} (${email})${start ? ` at ${start}` : ""}`.trim();
      });
      dataSources.scheduled_tours = { count: tourRows?.length ?? 0 };

      // Concierge tour names from daily_report_history (AM/PM) — merge with Calendly after we have amShift/pmShift

      // 5) Weather
      const weatherData = await fetchWeather(report_date);
      const weatherText = weatherData ? `${weatherData.temp} ${weatherData.condition}` : null;
      dataSources.weather = weatherData ?? { temp: "—", condition: "—" };

      // 6) Concierge shifts (daily_report_history) — shift_type AM/PM
      const { data: amShift } = await supabase
        .from("daily_report_history")
        .select("member_feedback, facility_issues, busiest_areas, membership_requests, management_notes, tour_notes, future_shift_notes, system_issues, cafe_notes")
        .eq("report_date", report_date)
        .eq("shift_type", "AM")
        .maybeSingle();

      const { data: pmShift } = await supabase
        .from("daily_report_history")
        .select("member_feedback, facility_issues, busiest_areas, membership_requests, management_notes, tour_notes, future_shift_notes, system_issues, cafe_notes")
        .eq("report_date", report_date)
        .eq("shift_type", "PM")
        .maybeSingle();

      type FeedbackItem = { sentiment?: string; text?: string };
      const toFeedback = (arr: unknown): FeedbackItem[] => (Array.isArray(arr) ? arr as FeedbackItem[] : []);

      const amFeedback = toFeedback(amShift?.member_feedback ?? []);
      const pmFeedback = toFeedback(pmShift?.member_feedback ?? []);

      const positiveAm = mergeTextFields(
        [],
        amFeedback.filter((f) => f.sentiment === "positive").map((f) => ({ text: f.text ?? "" }))
      );
      const positivePm = mergeTextFields(
        [],
        pmFeedback.filter((f) => f.sentiment === "positive").map((f) => ({ text: f.text ?? "" }))
      );
      const negativeAm = mergeTextFields(
        [],
        [
          ...amFeedback.filter((f) => f.sentiment === "negative").map((f) => ({ text: f.text ?? "" })),
          ...(Array.isArray(amShift?.system_issues) ? (amShift.system_issues as { description?: string }[]).map((s) => ({ text: s.description ?? "" })) : []),
        ]
      );
      const negativePm = mergeTextFields(
        [],
        [
          ...pmFeedback.filter((f) => f.sentiment === "negative").map((f) => ({ text: f.text ?? "" })),
          ...(Array.isArray(pmShift?.system_issues) ? (pmShift.system_issues as { description?: string }[]).map((s) => ({ text: s.description ?? "" })) : []),
        ]
      );

      const facilityAm = Array.isArray(amShift?.facility_issues)
        ? (amShift.facility_issues as { description?: string }[]).map((f) => ({ description: f.description ?? "" }))
        : [];
      const facilityPm = Array.isArray(pmShift?.facility_issues)
        ? (pmShift.facility_issues as { description?: string }[]).map((f) => ({ description: f.description ?? "" }))
        : [];

      const otherParts: string[] = [];
      [...amFeedback.filter((f) => f.sentiment === "neutral"), ...pmFeedback.filter((f) => f.sentiment === "neutral")]
        .forEach((f) => f.text && otherParts.push(f.text));
      if (amShift?.management_notes) otherParts.push(`[AM] ${amShift.management_notes}`);
      if (pmShift?.management_notes) otherParts.push(`[PM] ${pmShift.management_notes}`);
      const futureNotes = [
        ...(Array.isArray(amShift?.future_shift_notes) ? (amShift.future_shift_notes as string[]) : []),
        ...(Array.isArray(pmShift?.future_shift_notes) ? (pmShift.future_shift_notes as string[]) : []),
      ];
      futureNotes.forEach((n) => n && otherParts.push(n));
      const otherNotes = otherParts.join("\n") || null;

      const membershipReqs = [
        ...(Array.isArray(amShift?.membership_requests) ? (amShift.membership_requests as { name?: string; email?: string; type?: string }[]) : []),
        ...(Array.isArray(pmShift?.membership_requests) ? (pmShift.membership_requests as { name?: string; email?: string; type?: string }[]) : []),
      ];
      const cancellationLines = membershipReqs.map((m) => `[CANCEL] ${m.name ?? ""} <${m.email ?? ""}> - ${(m as { membershipType?: string }).membershipType ?? ""}`);
      const cancellationNotes = cancellationLines.join("\n") || null;

      // Merge Concierge tour_notes (AM/PM) with Calendly tour lines
      type TourEntry = { name?: string; followupCompleted?: boolean };
      const formatConciergeTours = (arr: unknown, label: string): string => {
        if (!Array.isArray(arr) || arr.length === 0) return `${label}: No tours this ${label}`;
        const names = (arr as TourEntry[]).map((t) => (t.name ?? "").trim()).filter(Boolean);
        return names.length ? `${label}: ${names.join(", ")}` : `${label}: No tours this ${label}`;
      };
      const amTourLine = formatConciergeTours(amShift?.tour_notes ?? [], "AM");
      const pmTourLine = formatConciergeTours(pmShift?.tour_notes ?? [], "PM");
      const allTourParts = [...tourLines, amTourLine, pmTourLine].filter(Boolean);
      const tourNotes = allTourParts.join("\n") || null;

      // Merge Concierge cafe_notes (AM/PM) into daily_reports.cafe_notes
      const cafeParts: string[] = [];
      if (amShift?.cafe_notes && String(amShift.cafe_notes).trim()) {
        cafeParts.push(`[AM] ${String(amShift.cafe_notes).trim()}`);
      }
      if (pmShift?.cafe_notes && String(pmShift.cafe_notes).trim()) {
        cafeParts.push(`[PM] ${String(pmShift.cafe_notes).trim()}`);
      }
      const cafeNotes = cafeParts.length ? cafeParts.join("\n") : null;

      dataSources.daily_report_history = { am: !!amShift, pm: !!pmShift };

      // 7) Class schedule (from arketa_reservations_history + arketa_classes for time/instructor)
      const classIds = [...new Set((resRows ?? []).map((r) => r.class_id).filter(Boolean))] as string[];
      const classDetails: { time: string; name: string; instructor: string; signups: number; waitlist: number }[] = [];

      if (classIds.length > 0) {
        const { data: classRows } = await supabase
          .from("arketa_classes")
          .select("external_id, name, start_time, instructor_name")
          .in("external_id", classIds)
          .eq("class_date", report_date);

        for (const row of classRows ?? []) {
          const cid = row.external_id as string;
          const name = (row.name as string) ?? "";
          const key = Object.keys(classCounts).find((k) => k.startsWith(`${cid}-`)) ?? "";
          const counts = classCounts[key] ?? { name, signups: 0, waitlist: 0 };
          const startTime = row.start_time as string | null;
          const timeStr = startTime ? new Date(startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
          classDetails.push({
            time: timeStr,
            name: counts.name || name,
            instructor: (row.instructor_name as string) ?? "",
            signups: counts.signups,
            waitlist: counts.waitlist,
          });
        }
        classDetails.sort((a, b) => a.time.localeCompare(b.time));
      }

      const totalSales = grossSalesArketa + cafeSales;

      const payload = {
        report_date,
        weather: weatherText,
        total_gym_checkins: totalGymCheckins,
        total_class_checkins: totalClassCheckins,
        private_appointments: privateAppointments,
        gross_sales_membership: Math.round(grossSalesMembership * 100) / 100,
        gross_sales_other: Math.round(grossSalesOther * 100) / 100,
        gross_sales_arketa: Math.round(grossSalesArketa * 100) / 100,
        cafe_sales: Math.round(cafeSales * 100) / 100,
        total_sales: Math.round(totalSales * 100) / 100,
        total_reservations: totalReservations,
        total_cancellations: totalCancellations,
        total_no_shows: totalNoShows,
        total_waitlisted: totalWaitlisted,
        attendance_rate: attendanceRate,
        positive_feedback_am: positiveAm,
        positive_feedback_pm: positivePm,
        negative_feedback_am: negativeAm,
        negative_feedback_pm: negativePm,
        facility_notes_am: facilityAm,
        facility_notes_pm: facilityPm,
        crowd_comments_am: (amShift?.busiest_areas as string) ?? null,
        crowd_comments_pm: (pmShift?.busiest_areas as string) ?? null,
        tour_notes: tourNotes,
        cancellation_notes: cancellationNotes,
        other_notes: otherNotes,
        cafe_notes: cafeNotes,
        class_details: classDetails,
        class_popularity: classDetails.map((c) => ({ name: c.name, signups: c.signups })).sort((a, b) => b.signups - a.signups).slice(0, 10),
        instructor_metrics: {},
        member_metrics: {},
        last_synced_at: new Date().toISOString(),
        sync_source: syncSource,
      };

      const { data: upserted, error: upsertErr } = await supabase
        .from("daily_reports")
        .upsert(payload, { onConflict: "report_date", ignoreDuplicates: false })
        .select()
        .single();

      if (upsertErr) {
        return new Response(
          JSON.stringify({ success: false, error: upsertErr.message, date: report_date }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      results.push({ date: report_date, report: upserted, data_sources: dataSources });
    }

    return new Response(
      JSON.stringify(
        dates.length === 1
          ? { success: true, ...results[0] }
          : { success: true, dates, results }
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
