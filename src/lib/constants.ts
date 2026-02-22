// Application constants

export const APP_NAME = "My App";
export const APP_DESCRIPTION = "A modern React application";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
} as const;

export const add_color = {
  green: "#62bb47",
  yellow: "#fcb827",
  purple: "#7c3aed",
  blue: "#009ddc",
  red: "#e03a3c",
  orange: "#f6821f",
} as const;

export const QUERY_KEYS = {
  USER: ["user"],
  PROFILE: ["profile"],
} as const;
