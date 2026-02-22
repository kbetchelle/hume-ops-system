import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getOfflineBootstrapDb,
  getBootstrapMeta,
  setBootstrapMeta,
  setBootstrapEntry,
  clearStaleBootstrapEntries,
} from "@/lib/offlineBootstrapDb";
import type { AppRole } from "@/types/roles";

const BOOTSTRAP_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const BOH_ROLES: AppRole[] = ["female_spa_attendant", "male_spa_attendant", "floater"];

export interface OfflineBootstrapConfig {
  role: AppRole;
  userId: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isWeekend(date: string): boolean {
  const d = new Date(date + "T12:00:00Z");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function useOfflineBootstrap(config: OfflineBootstrapConfig | null) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!config || !config.userId || !config.role) return;

    const run = () => {
      const today = getToday();
      getBootstrapMeta()
        .then((meta) => {
          if (meta && Date.now() - meta.lastBootstrap < BOOTSTRAP_COOLDOWN_MS) {
            console.log("[OfflineBootstrap] Skipping: cached < 1 hour ago");
            return;
          }
          if (didRun.current) return;
          didRun.current = true;

          console.log("[OfflineBootstrap] Starting for role:", config.role);

          const runBootstrap = async () => {
            try {
              await clearStaleBootstrapEntries(today);

              if (BOH_ROLES.includes(config.role)) {
                await bootstrapBOH(config, today);
              } else if (config.role === "concierge") {
                await bootstrapConcierge(config, today);
              }

              await setBootstrapMeta({
                lastBootstrap: Date.now(),
                userId: config.userId,
                role: config.role,
              });
              console.log("[OfflineBootstrap] Done");
            } catch (err) {
              console.warn("[OfflineBootstrap] Error:", err);
            }
          };

          runBootstrap();
        })
        .catch((err) => console.warn("[OfflineBootstrap] Meta check failed:", err));
    };

    const schedule =
      typeof requestIdleCallback !== "undefined"
        ? () => requestIdleCallback(run, { timeout: 2000 })
        : () => setTimeout(run, 500);

    schedule();
  }, [config?.userId, config?.role]);
}

async function bootstrapBOH(
  config: OfflineBootstrapConfig,
  today: string
): Promise<void> {
  const weekend = isWeekend(today);
  const roleType =
    config.role === "floater"
      ? "floater"
      : config.role === "male_spa_attendant"
        ? "male_spa_attendant"
        : "female_spa_attendant";

  console.log("[OfflineBootstrap] Fetching BOH checklist");
  const [amRes, pmRes] = await Promise.all([
    supabase
      .from("boh_checklists")
      .select("*, boh_checklist_items(*)")
      .eq("is_active", true)
      .eq("role_type", roleType)
      .eq("shift_time", "AM")
      .eq("is_weekend", weekend)
      .maybeSingle(),
    supabase
      .from("boh_checklists")
      .select("*, boh_checklist_items(*)")
      .eq("is_active", true)
      .eq("role_type", roleType)
      .eq("shift_time", "PM")
      .eq("is_weekend", weekend)
      .maybeSingle(),
  ]);
  const payload: { AM: unknown; PM: unknown } = {
    AM: amRes.data ?? null,
    PM: pmRes.data ?? null,
  };
  await setBootstrapEntry(`checklist-${config.role}-${today}`, payload);

  const { data: completions } = await supabase
    .from("boh_completions")
    .select("*")
    .eq("completion_date", today)
    .eq("completed_by_id", config.userId);
  if (completions?.length) {
    await setBootstrapEntry(`boh-completions-${config.role}-${today}`, completions);
  }

  await fetchAndCacheSchedule(today);
}

async function bootstrapConcierge(
  config: OfflineBootstrapConfig,
  today: string
): Promise<void> {
  const weekend = isWeekend(today);

  console.log("[OfflineBootstrap] Fetching Concierge checklist");
  const { data: checklists, error: listErr } = await supabase
    .from("concierge_checklists")
    .select("*")
    .eq("is_active", true)
    .eq("is_weekend", weekend);
  if (!listErr && checklists?.length) {
    const checklist = checklists[0];
    const { data: items } = await supabase
      .from("concierge_checklist_items")
      .select("*")
      .eq("checklist_id", checklist.id)
      .order("sort_order");
    await setBootstrapEntry(`checklist-concierge-${today}`, { checklist, items: items ?? [] });
  }

  const { data: completions } = await supabase
    .from("concierge_completions")
    .select("*")
    .eq("completion_date", today)
    .eq("completed_by_id", config.userId);
  if (completions?.length) {
    await setBootstrapEntry(`concierge-completions-${today}`, completions);
  }

  console.log("[OfflineBootstrap] Fetching shift draft");
  const { data: draftAM } = await supabase
    .from("concierge_drafts")
    .select("*")
    .eq("report_date", today)
    .eq("shift_type", "AM")
    .maybeSingle();
  const { data: draftPM } = await supabase
    .from("concierge_drafts")
    .select("*")
    .eq("report_date", today)
    .eq("shift_type", "PM")
    .maybeSingle();
  await setBootstrapEntry(`shift-draft-${today}`, { AM: draftAM ?? null, PM: draftPM ?? null });

  await fetchAndCacheSchedule(today);

  console.log("[OfflineBootstrap] Fetching events/tours");
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;
  const [toursRes, scheduleRes] = await Promise.all([
    supabase
      .from("scheduled_tours")
      .select("*")
      .gte("scheduled_at", startOfDay)
      .lte("scheduled_at", endOfDay),
    supabase
      .from("daily_schedule")
      .select("*")
      .eq("class_date", today),
  ]);
  await setBootstrapEntry(`events-${today}`, {
    tours: toursRes.data ?? [],
    schedule: scheduleRes.data ?? [],
  });
}

async function fetchAndCacheSchedule(today: string): Promise<void> {
  console.log("[OfflineBootstrap] Fetching class schedule");
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;
  const { data: classes, error } = await supabase
    .from("arketa_classes")
    .select("*")
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time", { ascending: true });
  if (!error && classes) {
    await setBootstrapEntry(`schedule-${today}`, classes);
  }
}
