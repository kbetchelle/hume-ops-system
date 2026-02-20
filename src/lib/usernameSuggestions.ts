/**
 * Suggest a unique username from first_name and last_name.
 * Base = first_name (or last_name if first empty). If not unique, append letters from last_name
 * one at a time (e.g. dylan -> dylanL -> dylanLa). If still not unique after full last_name,
 * add numeric suffix (2, 3, ...).
 */
export function suggestUsername(
  firstName: string | null,
  lastName: string | null,
  taken: Set<string>
): string {
  const first = normalizeSegment(firstName ?? "");
  const last = normalizeSegment(lastName ?? "");
  const base = first || last || "user";
  const takenLower = new Set([...taken].map((s) => s.toLowerCase()));

  function isTaken(candidate: string): boolean {
    return takenLower.has(candidate.toLowerCase());
  }

  if (!isTaken(base)) return base;

  if (!last) {
    let n = 2;
    while (isTaken(`${base}${n}`)) n++;
    return `${base}${n}`;
  }

  for (let len = 1; len <= last.length; len++) {
    const suffix = last.slice(0, len);
    const candidate = base + suffix;
    if (!isTaken(candidate)) return candidate;
  }

  let n = 2;
  const fullSuffix = base + last;
  while (isTaken(`${fullSuffix}${n}`)) n++;
  return `${fullSuffix}${n}`;
}

/** Normalize for username: lowercase, only [a-z0-9_]. */
function normalizeSegment(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

/** Validate username: same rules as backend (lowercase, trim, [a-z0-9_]). */
export function normalizeUsernameForSubmit(raw: string): string | null {
  const t = raw?.trim?.()?.toLowerCase?.() ?? "";
  if (!t) return null;
  const sanitized = t.replace(/[^a-z0-9_]/g, "");
  return sanitized.length > 0 ? sanitized : null;
}
