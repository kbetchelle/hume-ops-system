/**
 * generate-report-pdf: Server-side PDF generation for daily/weekly reports.
 * Uses jsPDF; landscape for single-day and batch, summary + details for weekly.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COLORS = {
  headerDark: [50, 50, 50] as [number, number, number],
  headerMedium: [90, 85, 80] as [number, number, number],
  valueBox: [230, 230, 225] as [number, number, number],
  subsection: [210, 205, 200] as [number, number, number],
};
const FONT = "Helvetica";

interface RequestBody {
  report_date?: string;
  start_date?: string;
  end_date?: string;
  format: "single" | "weekly" | "batch";
}

type ReportRow = {
  report_date: string;
  weather: string | null;
  total_gym_checkins: number | null;
  total_class_checkins: number | null;
  private_appointments: number | null;
  gross_sales_membership: number | null;
  gross_sales_other: number | null;
  gross_sales_arketa: number | null;
  cafe_sales: number | null;
  total_sales: number | null;
  positive_feedback_am: { text?: string }[] | null;
  positive_feedback_pm: { text?: string }[] | null;
  negative_feedback_am: { text?: string }[] | null;
  negative_feedback_pm: { text?: string }[] | null;
  facility_notes_am: { description?: string }[] | null;
  facility_notes_pm: { description?: string }[] | null;
  crowd_comments_am: string | null;
  crowd_comments_pm: string | null;
  tour_notes: string | null;
  cancellation_notes: string | null;
  other_notes: string | null;
  cafe_notes: string | null;
  class_details: { time: string; name: string; instructor: string; signups: number; waitlist: number }[] | null;
};

function jsonbToLines(arr: { text?: string; description?: string }[] | null): string {
  if (!Array.isArray(arr)) return "";
  return arr.map((x) => (x.text ?? x.description ?? "")).filter(Boolean).join("\n");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${mm}/${dd}/${yyyy} ${dayName}`;
}

function formatMoney(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function addPageHeader(doc: jsPDF, dateStr: string, title: string) {
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text("HU+E", 0.5, 0.5);
  doc.text(title, 11 / 2 - doc.getTextWidth(title) / 2, 0.5);
  doc.text(formatDate(dateStr), 11 - 0.5 - doc.getTextWidth(formatDate(dateStr)), 0.5);
}

function addDataFinancialsSection(doc: jsPDF, report: ReportRow, startY: number) {
  const colW = (11 - 1) / 2;
  const leftX = 0.5;
  const rightX = 0.5 + colW + 0.25;

  doc.setFillColor(...COLORS.headerDark);
  doc.rect(0.5, startY, colW, 0.35, "F");
  doc.rect(0.5 + colW + 0.25, startY, colW, 0.35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("DATA", leftX + 0.1, startY + 0.24);
  doc.text("FINANCIALS", rightX + 0.1, startY + 0.24);

  let y = startY + 0.6;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(FONT, "normal");
  doc.text(`Weather: ${report.weather ?? "—"}`, leftX, y);
  y += 0.28;
  doc.text(`Total Gym Check-Ins: ${report.total_gym_checkins ?? 0}`, leftX, y);
  y += 0.28;
  doc.text(`Total Class Check-Ins: ${report.total_class_checkins ?? 0}`, leftX, y);
  y += 0.28;
  doc.text(`Private Appointments: ${report.private_appointments ?? 0}`, leftX, y);

  y = startY + 0.6;
  doc.text(`Gross Sales - Membership: ${formatMoney(report.gross_sales_membership)}`, rightX, y);
  y += 0.28;
  doc.text(`Gross Sales - Other: ${formatMoney(report.gross_sales_other)}`, rightX, y);
  y += 0.28;
  doc.text(`Café Sales: ${formatMoney(report.cafe_sales)}`, rightX, y);
  y += 0.28;
  doc.setFont(FONT, "bold");
  doc.text(`Total Sales: ${formatMoney(report.total_sales)}`, rightX, y);

  return startY + 0.6 + 4 * 0.28 + 0.2;
}

function addNotesSection(doc: jsPDF, report: ReportRow, startY: number): number {
  doc.setFillColor(...COLORS.headerMedium);
  doc.rect(0.5, startY, 11 - 1, 0.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("NOTES", 0.5 + 0.1, startY + 0.2);

  let y = startY + 0.5;
  const colW = (11 - 1.2) / 2;
  const leftX = 0.5;
  const rightX = 0.5 + colW + 0.2;

  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);

  const posAm = jsonbToLines(report.positive_feedback_am as { text?: string }[]);
  const posPm = jsonbToLines(report.positive_feedback_pm as { text?: string }[]);
  const posText = `Positive (AM/PM):\n${posAm || "—"}\n${posPm || "—"}`;
  const negAm = jsonbToLines(report.negative_feedback_am as { text?: string }[]);
  const negPm = jsonbToLines(report.negative_feedback_pm as { text?: string }[]);
  const negText = `Negative (AM/PM):\n${negAm || "—"}\n${negPm || "—"}`;

  doc.text(posText, leftX, y, { maxWidth: colW });
  doc.text(negText, rightX, y, { maxWidth: colW });
  y += 1.2;

  const facAm = jsonbToLines(report.facility_notes_am as { description?: string }[]);
  const facPm = jsonbToLines(report.facility_notes_pm as { description?: string }[]);
  const facText = `Facility (AM/PM):\n${facAm || "—"}\n${facPm || "—"}`;
  const crowdText = `Crowd/Space (AM/PM):\n${report.crowd_comments_am ?? "—"}\n${report.crowd_comments_pm ?? "—"}`;
  doc.text(facText, leftX, y, { maxWidth: colW });
  doc.text(crowdText, rightX, y, { maxWidth: colW });
  y += 1.0;

  doc.text(`Tour Notes:\n${report.tour_notes ?? "—"}`, leftX, y, { maxWidth: colW });
  doc.text(`Cancellation Notes:\n${report.cancellation_notes ?? "—"}`, rightX, y, { maxWidth: colW });
  y += 1.0;

  doc.text(`Notes for Management:\n${report.other_notes ?? "—"}\nCafé Notes:\n${report.cafe_notes ?? "—"}`, leftX, y, { maxWidth: 11 - 1 });

  return y + 0.8;
}

function addClassSchedulePage(doc: jsPDF, report: ReportRow, dateStr: string) {
  doc.addPage([11, 8.5], "landscape");
  addPageHeader(doc, dateStr, "Daily Report — Class Schedule");

  doc.setFillColor(...COLORS.headerDark);
  doc.rect(0.5, 0.7, 11 - 1, 0.35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("CLASS SCHEDULE", 0.5 + 0.1, 0.92);

  const details = report.class_details ?? [];
  if (details.length === 0) {
    doc.setTextColor(0, 0, 0);
    doc.text("No class data for this date.", 0.5, 1.3);
    return;
  }

  const colW = (11 - 1 - 0.4) / 4;
  let y = 1.15;
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.text("Time", 0.5, y);
  doc.text("Sign-ups", 0.5 + colW, y);
  doc.text("Instructor", 0.5 + colW * 2, y);
  doc.text("Class Name", 0.5 + colW * 3, y);
  y += 0.25;

  doc.setFont(FONT, "normal");
  for (const row of details) {
    doc.text(row.time, 0.5, y);
    doc.text(String(row.signups), 0.5 + colW, y);
    doc.text(row.instructor ?? "", 0.5 + colW * 2, y);
    doc.text(row.name ?? "", 0.5 + colW * 3, y);
    y += 0.22;
  }
}

function renderSingleDay(doc: jsPDF, report: ReportRow) {
  addPageHeader(doc, report.report_date, "Daily Report");

  let y = addDataFinancialsSection(doc, report, 0.7);
  y = addNotesSection(doc, report, y);
  addClassSchedulePage(doc, report, report.report_date);
}

function renderWeeklySummary(doc: jsPDF, reports: ReportRow[], startDate: string, endDate: string) {
  doc.addPage([8.5, 11], "portrait");
  doc.setFontSize(14);
  doc.text("Weekly Report Summary", 0.5, 0.7);
  doc.setFontSize(10);
  doc.text(`${formatDate(startDate)} — ${formatDate(endDate)}`, 0.5, 1.0);

  let totalGym = 0, totalClass = 0, totalAppts = 0, totalSales = 0, totalCafe = 0;
  for (const r of reports) {
    totalGym += r.total_gym_checkins ?? 0;
    totalClass += r.total_class_checkins ?? 0;
    totalAppts += r.private_appointments ?? 0;
    totalSales += Number(r.total_sales ?? 0);
    totalCafe += Number(r.cafe_sales ?? 0);
  }

  doc.setFontSize(9);
  let y = 1.4;
  doc.text(`Total Gym Check-Ins: ${totalGym}`, 0.5, y);
  y += 0.25;
  doc.text(`Total Class Check-Ins: ${totalClass}`, 0.5, y);
  y += 0.25;
  doc.text(`Private Appointments: ${totalAppts}`, 0.5, y);
  y += 0.25;
  doc.text(`Total Sales: ${formatMoney(totalSales)}`, 0.5, y);
  y += 0.25;
  doc.text(`Café Sales: ${formatMoney(totalCafe)}`, 0.5, y);
  y += 0.4;

  doc.setFont(FONT, "bold");
  doc.text("Date", 0.5, y);
  doc.text("Gym", 1.8, y);
  doc.text("Class", 2.3, y);
  doc.text("Appts", 2.8, y);
  doc.text("Sales", 3.5, y);
  y += 0.28;
  doc.setFont(FONT, "normal");

  for (const r of reports) {
    doc.text(r.report_date, 0.5, y);
    doc.text(String(r.total_gym_checkins ?? 0), 1.8, y);
    doc.text(String(r.total_class_checkins ?? 0), 2.3, y);
    doc.text(String(r.private_appointments ?? 0), 2.8, y);
    doc.text(formatMoney(r.total_sales), 3.5, y);
    y += 0.25;
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const format = body.format ?? "single";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let dates: string[] = [];
    if (format === "single" && body.report_date) {
      dates = [body.report_date];
    } else if ((format === "weekly" || format === "batch") && body.start_date && body.end_date) {
      const start = new Date(body.start_date);
      const end = new Date(body.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Missing report_date or start_date/end_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: rows, error } = await supabase
      .from("daily_reports")
      .select("*")
      .in("report_date", dates)
      .order("report_date", { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reports = (rows ?? []) as ReportRow[];

    const isSingle = format === "single" && reports.length > 0;
    const isWeekly = format === "weekly" && reports.length > 0;
    const isBatch = format === "batch";

    const doc = new jsPDF({
      orientation: isWeekly ? "portrait" : "landscape",
      unit: "in",
      format: "letter",
    });

    if (isSingle) {
      renderSingleDay(doc, reports[0]);
    } else if (isWeekly) {
      renderWeeklySummary(doc, reports, dates[0], dates[dates.length - 1]);
      for (let i = 0; i < reports.length; i++) {
        doc.addPage([11, 8.5], "landscape");
        renderSingleDay(doc, reports[i]);
      }
    } else if (isBatch && reports.length > 0) {
      for (let i = 0; i < reports.length; i++) {
        if (i > 0) doc.addPage([11, 8.5], "landscape");
        renderSingleDay(doc, reports[i]);
      }
    }

    if (reports.length === 0) {
      doc.setFontSize(12);
      doc.text(
        format === "single" ? "No report data for this date." : "No report data for selected dates.",
        0.5,
        1
      );
    }

    const pdfBytes = doc.output("arraybuffer");
    const filename = format === "single"
      ? `Daily-Report-${dates[0]}.pdf`
      : `Report-${dates[0]}-to-${dates[dates.length - 1]}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
