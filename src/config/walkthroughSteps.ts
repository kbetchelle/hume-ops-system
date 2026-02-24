/**
 * Walkthrough step configuration per role.
 * Structure is database-ready (serializable); runtime steps are built via getWalkthroughStepsForRole.
 */

import type { AppRole } from "@/types/roles";
import type { WalkthroughStep, WalkthroughArrowDirection } from "@/components/walkthrough/WalkthroughOverlay";

// ---------------------------------------------------------------------------
// Serializable step config (could be loaded from DB later)
// ---------------------------------------------------------------------------

export type WalkthroughShowWhenKey = "always" | "multiple_roles";

export interface WalkthroughStepConfig {
  id: string;
  targetSelector: string;
  arrowDirection: WalkthroughArrowDirection;
  text: string;
  textEs?: string;
  showWhenKey?: WalkthroughShowWhenKey;
  /** Show a static replica of the user menu dropdown on this step */
  showMenuPreview?: boolean;
}

export interface WalkthroughContext {
  firstName: string;
  hasMultipleRoles: boolean;
}

/** Translator: (english, spanish?) => resolved string */
export type WalkthroughTranslator = (en: string, es?: string | null) => string;

// Dummy selector so no element is found → overlay renders welcome centered with no arrow
const WELCOME_TARGET = "[data-walkthrough=welcome]";

// Welcome message templates (interpolate firstName and totalCount)
const WELCOME_EN = "Welcome to Hume, {name}!\n\nWe'll walk you through a few quick things to get started.";
const WELCOME_ES = "¡Bienvenido a Hume, {name}!\n\nTe mostraremos {n} funciones principales para que empieces.";

// Universal steps (same for all roles that get a walkthrough)
const UNIVERSAL_USER_MENU: WalkthroughStepConfig = {
  id: "user-menu",
  targetSelector: "[data-walkthrough=user-menu]",
  arrowDirection: "right",
  text: "Your profile, settings, and sign out live here.",
  textEs: "Tu perfil, ajustes y cerrar sesión están aquí.",
};

const UNIVERSAL_BUG: WalkthroughStepConfig = {
  id: "bug-report",
  targetSelector: "[data-walkthrough=user-menu]",
  arrowDirection: "left",
  text: "Send suggestions, issues, or compliments here.",
  textEs: "Envía sugerencias, incidencias o cumplidos aquí.",
};

// Manager (admin + manager) role-specific steps
const MANAGER_ROLE_SWITCHER: WalkthroughStepConfig = {
  id: "role-switcher",
  targetSelector: "[data-walkthrough=role-switcher]",
  arrowDirection: "left",
  text: "This app is organized by role. To change role, select a role from this dropdown.",
  textEs: "La app se organiza por rol. Para cambiar de rol, elige uno en este menú.",
  showWhenKey: "multiple_roles",
};

const MANAGER_NOTIFICATION_CENTER: WalkthroughStepConfig = {
  id: "notification-center",
  targetSelector: "[data-walkthrough=notification-center]",
  arrowDirection: "left",
  text: "Manage notification settings for your team here.",
  textEs: "Gestiona las notificaciones de tu equipo aquí.",
};

const MANAGER_PACKAGE_TRACKING: WalkthroughStepConfig = {
  id: "package-tracking-manager",
  targetSelector: "[data-walkthrough=package-tracking]",
  arrowDirection: "left",
  text: "Help concierge by logging items put in the safe in here.",
  textEs: "Ayuda al conserje registrando aquí los objetos que guardas en la caja fuerte.",
};

// Concierge role-specific steps
const CONCIERGE_RESOURCES: WalkthroughStepConfig = {
  id: "resources",
  targetSelector: "[data-walkthrough=resources]",
  arrowDirection: "left",
  text: "Search all resources here, or click to view quick links or resource pages.",
  textEs: "Busca todos los recursos aquí o haz clic para ver enlaces rápidos y páginas de recursos.",
};

const CONCIERGE_PACKAGE_TRACKING: WalkthroughStepConfig = {
  id: "package-tracking-concierge",
  targetSelector: "[data-walkthrough=package-tracking]",
  arrowDirection: "left",
  text: "Scan in packages, submit a photo of where they're kept, and edit a package if you move it.",
  textEs: "Escanea paquetes, envía una foto de dónde se guardan y edita un paquete si lo mueves.",
};

const CONCIERGE_LOST_FOUND: WalkthroughStepConfig = {
  id: "lost-and-found",
  targetSelector: "[data-walkthrough=lost-and-found]",
  arrowDirection: "left",
  text: "Only for high-value items. There's an 'In Safe?' tool so you can see what's currently in the safe.",
  textEs: "Solo para objetos de valor. La herramienta «¿En caja fuerte?» muestra qué hay ahora en la caja fuerte.",
};

// Cafe role-specific steps
const CAFE_SHIFT_TOGGLE: WalkthroughStepConfig = {
  id: "cafe-shift-toggle",
  targetSelector: "[data-walkthrough=cafe-shift-toggle]",
  arrowDirection: "bottom",
  text: "Switch between shifts here.",
  textEs: "Cambia entre turnos aquí.",
};

const CAFE_PACKAGE_TRACKING: WalkthroughStepConfig = {
  id: "package-tracking-cafe",
  targetSelector: "[data-walkthrough=package-tracking]",
  arrowDirection: "left",
  text: "You'll be notified when you have a package and where it's put. Please mark your package received when you pick it up.",
  textEs: "Te avisaremos cuando tengas un paquete y dónde está. Marca que lo has recogido cuando lo retires.",
};

// ---------------------------------------------------------------------------
// Mobile-specific steps (target mobile UI elements)
// ---------------------------------------------------------------------------

const MOBILE_BOTTOM_NAV: WalkthroughStepConfig = {
  id: "mobile-bottom-nav",
  targetSelector: "[data-walkthrough=mobile-bottom-nav]",
  arrowDirection: "bottom",
  text: "Use the bottom tabs to navigate between your main pages.",
  textEs: "Usa las pestañas inferiores para navegar entre tus páginas principales.",
};

const MOBILE_MORE_MENU: WalkthroughStepConfig = {
  id: "mobile-more-menu",
  targetSelector: "[data-walkthrough=mobile-more-tab]",
  arrowDirection: "bottom",
  text: "Tap 'More' for additional pages, settings, sign out, and bug reports.",
  textEs: "Toca «Más» para páginas adicionales, ajustes, cerrar sesión y reportar problemas.",
};

const MOBILE_NOTIFICATION_BELL: WalkthroughStepConfig = {
  id: "mobile-notification-bell",
  targetSelector: "[data-walkthrough=mobile-notification-bell]",
  arrowDirection: "top",
  text: "Check your notifications here.",
  textEs: "Consulta tus notificaciones aquí.",
};

const MOBILE_ROLE_CHIP: WalkthroughStepConfig = {
  id: "mobile-role-chip",
  targetSelector: "[data-walkthrough=mobile-role-chip]",
  arrowDirection: "top",
  text: "Switch between your roles using this dropdown.",
  textEs: "Cambia entre tus roles usando este menú.",
  showWhenKey: "multiple_roles",
};

// Mobile role-specific steps

const MOBILE_MANAGER_STEPS: WalkthroughStepConfig[] = [
  MOBILE_NOTIFICATION_BELL,
  MOBILE_ROLE_CHIP,
];

const MOBILE_CONCIERGE_STEPS: WalkthroughStepConfig[] = [
  MOBILE_ROLE_CHIP,
];

const MOBILE_CAFE_STEPS: WalkthroughStepConfig[] = [];

function getMobileRoleSpecificSteps(role: AppRole): WalkthroughStepConfig[] {
  if (role === "admin" || role === "manager") return MOBILE_MANAGER_STEPS;
  if (role === "concierge") return MOBILE_CONCIERGE_STEPS;
  if (role === "cafe") return MOBILE_CAFE_STEPS;
  return [];
}

// ---------------------------------------------------------------------------
// Desktop/tablet role-specific step blocks
// ---------------------------------------------------------------------------

const MANAGER_STEPS: WalkthroughStepConfig[] = [
  MANAGER_ROLE_SWITCHER,
  MANAGER_NOTIFICATION_CENTER,
  MANAGER_PACKAGE_TRACKING,
];

const CONCIERGE_STEPS: WalkthroughStepConfig[] = [
  CONCIERGE_RESOURCES,
  CONCIERGE_PACKAGE_TRACKING,
  CONCIERGE_LOST_FOUND,
];

const CAFE_STEPS: WalkthroughStepConfig[] = [
  CAFE_SHIFT_TOGGLE,
  CAFE_PACKAGE_TRACKING,
];

function getRoleSpecificSteps(role: AppRole): WalkthroughStepConfig[] {
  if (role === "admin" || role === "manager") return MANAGER_STEPS;
  if (role === "concierge") return CONCIERGE_STEPS;
  if (role === "cafe") return CAFE_STEPS;
  return [];
}

// ---------------------------------------------------------------------------
// Build runtime steps
// ---------------------------------------------------------------------------

function includeStep(config: WalkthroughStepConfig, context: WalkthroughContext): boolean {
  if (config.showWhenKey === "multiple_roles") return context.hasMultipleRoles;
  return true;
}

/**
 * Builds the full ordered list of step configs for a role (with showWhen applied),
 * so we can compute total count for the welcome message.
 */
function getOrderedConfigs(role: AppRole, context: WalkthroughContext): WalkthroughStepConfig[] {
  const roleSteps = getRoleSpecificSteps(role).filter((s) => includeStep(s, context));
  const isManager = role === "admin" || role === "manager";
  const userMenu = isManager
    ? { ...UNIVERSAL_USER_MENU, showMenuPreview: true }
    : UNIVERSAL_USER_MENU;
  const bugStep = isManager
    ? { ...UNIVERSAL_BUG, showMenuPreview: true }
    : UNIVERSAL_BUG;
  const middle: WalkthroughStepConfig[] = [userMenu, ...roleSteps, bugStep];
  const totalCount = middle.length;
  const welcomeEn = WELCOME_EN.replace("{name}", context.firstName).replace("{n}", String(totalCount));
  const welcomeEs = WELCOME_ES.replace("{name}", context.firstName).replace("{n}", String(totalCount));
  const welcome: WalkthroughStepConfig = {
    id: "welcome",
    targetSelector: WELCOME_TARGET,
    arrowDirection: "left",
    text: welcomeEn,
    textEs: welcomeEs,
  };
  return [welcome, ...middle];
}

/**
 * Builds the full ordered list of mobile step configs for a role.
 */
function getMobileOrderedConfigs(role: AppRole, context: WalkthroughContext): WalkthroughStepConfig[] {
  const roleSteps = getMobileRoleSpecificSteps(role).filter((s) => includeStep(s, context));
  const middle: WalkthroughStepConfig[] = [MOBILE_BOTTOM_NAV, MOBILE_MORE_MENU, ...roleSteps];
  const totalCount = middle.length;
  const welcomeEn = WELCOME_EN.replace("{name}", context.firstName).replace("{n}", String(totalCount));
  const welcomeEs = WELCOME_ES.replace("{name}", context.firstName).replace("{n}", String(totalCount));
  const welcome: WalkthroughStepConfig = {
    id: "welcome",
    targetSelector: WELCOME_TARGET,
    arrowDirection: "left",
    text: welcomeEn,
    textEs: welcomeEs,
  };
  return [welcome, ...middle];
}

/**
 * Returns WalkthroughStep[] for the overlay with translated text.
 * Welcome step uses a dummy selector so the overlay renders it centered with no arrow.
 */
export function getWalkthroughStepsForRole(
  role: AppRole,
  context: WalkthroughContext,
  t: WalkthroughTranslator
): WalkthroughStep[] {
  const configs = getOrderedConfigs(role, context);
  return configs.map(
    (c): WalkthroughStep => ({
      target: c.targetSelector,
      arrowDirection: c.arrowDirection,
      text: t(c.text, c.textEs ?? null),
      ...(c.showMenuPreview ? { showMenuPreview: true } : {}),
    })
  );
}

/**
 * Returns mobile-specific WalkthroughStep[] targeting bottom nav, more menu, etc.
 */
export function getMobileWalkthroughStepsForRole(
  role: AppRole,
  context: WalkthroughContext,
  t: WalkthroughTranslator
): WalkthroughStep[] {
  const configs = getMobileOrderedConfigs(role, context);
  return configs.map(
    (c): WalkthroughStep => ({
      target: c.targetSelector,
      arrowDirection: c.arrowDirection,
      text: t(c.text, c.textEs ?? null),
    })
  );
}

/**
 * Back-of-house roles skip the walkthrough entirely (no steps).
 */
export const BOH_WALKTHROUGH_ROLES: AppRole[] = [
  "female_spa_attendant",
  "male_spa_attendant",
  "floater",
];

export function isBohWalkthroughRole(role: AppRole | null): boolean {
  return role !== null && BOH_WALKTHROUGH_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Page hint content (idle hint prompts) — centralized for i18n
// ---------------------------------------------------------------------------

export const PAGE_HINT_CONTENT: Record<string, { en: string; es: string }> = {
  "package-tracking": {
    en: "Scan in packages here, add a photo of where they're kept, and edit a package if you move it.",
    es: "Escanea paquetes aquí, añade una foto de dónde se guardan y edita un paquete si lo mueves.",
  },
  "cafe-shift-toggle": {
    en: "Switch between AM and PM shifts here. Your checklist and views update for the selected shift.",
    es: "Cambia entre turnos AM y PM aquí. Tu lista y vistas se actualizan según el turno seleccionado.",
  },
  "resources": {
    en: "Search all resources here, or open quick links and resource pages from the sidebar.",
    es: "Busca todos los recursos aquí o abre enlaces rápidos y páginas de recursos desde la barra lateral.",
  },
};

/**
 * Returns page hint copy for a given hint id, or undefined if not defined.
 */
export function getPageHintContent(hintId: string): { en: string; es: string } | undefined {
  return PAGE_HINT_CONTENT[hintId];
}
