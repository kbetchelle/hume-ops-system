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

/** e.g. "Tuesday, February 3, 2026" for daily report title */
function formatDateForDailyTitle(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** e.g. "Feb 3 - Feb 9, 2026" for weekly summary */
function formatWeeklyDateRange(startDate: string, endDate: string): string {
  const s = new Date(startDate + "T12:00:00");
  const e = new Date(endDate + "T12:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} - ${fmt(e)}`;
}

/** e.g. "Tue, Feb 3" for daily breakdown table */
function formatTableDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  doc.rect(0.5, startY, 11 - 1, 0.35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("DATA FINANCIALS", leftX + 0.1, startY + 0.24);

  let y = startY + 0.6;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(FONT, "normal");
  doc.text(`Weather: ${report.weather ?? "—"}`, leftX, y);
  doc.text(`Membership: ${formatMoney(report.gross_sales_membership)}`, rightX, y);
  y += 0.28;
  doc.text(`Gym Check-ins: ${report.total_gym_checkins ?? 0}`, leftX, y);
  doc.text(`Other: ${formatMoney(report.gross_sales_other)}`, rightX, y);
  y += 0.28;
  doc.text(`Class Check-ins: ${report.total_class_checkins ?? 0}`, leftX, y);
  doc.text(`Café: ${formatMoney(report.cafe_sales)}`, rightX, y);
  y += 0.28;
  doc.text(`Appointments: ${report.private_appointments ?? 0}`, leftX, y);
  doc.setFont(FONT, "bold");
  doc.text(`Total: ${formatMoney(report.total_sales)}`, rightX, y);

  return startY + 0.6 + 4 * 0.28 + 0.2;
}

function addNotesSection(doc: jsPDF, report: ReportRow, startY: number): number {
  const colW = (11 - 1.2) / 2;
  const leftX = 0.5;
  const rightX = 0.5 + colW + 0.2;
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  let y = startY;

  const addSection = (title: string, amContent: string, pmContent: string) => {
    doc.setFillColor(...COLORS.headerMedium);
    doc.rect(0.5, y, 11 - 1, 0.3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(title, 0.5 + 0.1, y + 0.2);
    y += 0.5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(`AM: ${amContent || "—"}`, leftX, y, { maxWidth: colW });
    doc.text(`PM: ${pmContent || "—"}`, rightX, y, { maxWidth: colW });
    y += 0.6;
  };

  const posAm = jsonbToLines(report.positive_feedback_am as { text?: string }[]);
  const posPm = jsonbToLines(report.positive_feedback_pm as { text?: string }[]);
  addSection("POSITIVE FEEDBACK", posAm, posPm);

  const negAm = jsonbToLines(report.negative_feedback_am as { text?: string }[]);
  const negPm = jsonbToLines(report.negative_feedback_pm as { text?: string }[]);
  addSection("NEGATIVE FEEDBACK", negAm, negPm);

  const facAm = jsonbToLines(report.facility_notes_am as { description?: string }[]);
  const facPm = jsonbToLines(report.facility_notes_pm as { description?: string }[]);
  addSection("FACILITY NOTES", facAm, facPm);

  addSection(
    "CROWD COMMENTS",
    report.crowd_comments_am ?? "",
    report.crowd_comments_pm ?? ""
  );

  doc.setFillColor(...COLORS.headerMedium);
  doc.rect(0.5, y, 11 - 1, 0.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("TOUR NOTES", 0.5 + 0.1, y + 0.2);
  y += 0.5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(report.tour_notes ?? "—", leftX, y, { maxWidth: 11 - 1 });
  y += 0.5;

  doc.setFillColor(...COLORS.headerMedium);
  doc.rect(0.5, y, 11 - 1, 0.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("CAFÉ NOTES", 0.5 + 0.1, y + 0.2);
  y += 0.5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(report.cafe_notes ?? "—", leftX, y, { maxWidth: 11 - 1 });
  y += 0.5;

  if (report.cancellation_notes || report.other_notes) {
    doc.setFillColor(...COLORS.headerMedium);
    doc.rect(0.5, y, 11 - 1, 0.3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("OTHER / CANCELLATION NOTES", 0.5 + 0.1, y + 0.2);
    y += 0.5;
    doc.setTextColor(0, 0, 0);
    const other = [report.cancellation_notes, report.other_notes].filter(Boolean).join("\n") || "—";
    doc.text(other, leftX, y, { maxWidth: 11 - 1 });
    y += 0.5;
  }

  return y + 0.3;
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

function renderSingleDay(
  doc: jsPDF,
  report: ReportRow,
  pageIndex?: number,
  totalPages?: number
) {
  const dailyTitle = `Daily Report - ${formatDateForDailyTitle(report.report_date)}`;
  addPageHeader(doc, report.report_date, dailyTitle);

  let y = addDataFinancialsSection(doc, report, 0.7);
  y = addNotesSection(doc, report, y);
  if (totalPages != null && pageIndex != null) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const label = `-- ${pageIndex + 1} of ${totalPages} --`;
    doc.text(label, 11 / 2 - doc.getTextWidth(label) / 2, 8.5 - 0.35);
    doc.setTextColor(0, 0, 0);
  }
  addClassSchedulePage(doc, report, report.report_date);
}

function renderWeeklySummary(doc: jsPDF, reports: ReportRow[], startDate: string, endDate: string) {
  doc.addPage([8.5, 11], "portrait");
  doc.setFontSize(14);
  doc.text("HU+E Weekly Report Summary", 0.5, 0.7);
  doc.setFontSize(10);
  doc.text(formatWeeklyDateRange(startDate, endDate), 0.5, 1.0);

  let totalGym = 0,
    totalClass = 0,
    totalAppts = 0,
    totalSales = 0,
    totalMembership = 0,
    totalOther = 0,
    totalCafe = 0;
  for (const r of reports) {
    totalGym += r.total_gym_checkins ?? 0;
    totalClass += r.total_class_checkins ?? 0;
    totalAppts += r.private_appointments ?? 0;
    totalSales += Number(r.total_sales ?? 0);
    totalMembership += Number(r.gross_sales_membership ?? 0);
    totalOther += Number(r.gross_sales_other ?? 0);
    totalCafe += Number(r.cafe_sales ?? 0);
  }

  doc.setFillColor(...COLORS.headerDark);
  doc.rect(0.5, 1.2, 8.5 - 1, 0.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("WEEKLY SUMMARY", 0.5 + 0.1, 1.42);
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  let y = 1.75;
  doc.text(
    `Total Gym Check-ins: ${totalGym}  Total Class Check-ins: ${totalClass}  Total Appointments: ${totalAppts}  Total Sales: ${formatMoney(totalSales)}`,
    0.5,
    y
  );
  y += 0.28;
  doc.text(
    `Membership Sales: ${formatMoney(totalMembership)}  Other Sales: ${formatMoney(totalOther)}  Café Sales: ${formatMoney(totalCafe)}  Reports: ${reports.length} days`,
    0.5,
    y
  );
  y += 0.5;

  doc.setFillColor(...COLORS.headerDark);
  doc.rect(0.5, y, 8.5 - 1, 0.3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("DAILY BREAKDOWN", 0.5 + 0.1, y + 0.2);
  y += 0.55;
  doc.setTextColor(0, 0, 0);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.text("Date", 0.5, y);
  doc.text("Gym", 1.4, y);
  doc.text("Class", 1.85, y);
  doc.text("Appts", 2.25, y);
  doc.text("Membership", 2.7, y);
  doc.text("Other", 3.4, y);
  doc.text("Café", 3.9, y);
  doc.text("Total", 4.4, y);
  y += 0.28;
  doc.setFont(FONT, "normal");

  for (const r of reports) {
    doc.text(formatTableDate(r.report_date), 0.5, y);
    doc.text(String(r.total_gym_checkins ?? 0), 1.4, y);
    doc.text(String(r.total_class_checkins ?? 0), 1.85, y);
    doc.text(String(r.private_appointments ?? 0), 2.25, y);
    doc.text(formatMoney(r.gross_sales_membership), 2.7, y);
    doc.text(formatMoney(r.gross_sales_other), 3.4, y);
    doc.text(formatMoney(r.cafe_sales), 3.9, y);
    doc.text(formatMoney(r.total_sales), 4.4, y);
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
        renderSingleDay(doc, reports[i], i, reports.length);
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
