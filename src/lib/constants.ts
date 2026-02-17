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
  olive: "#62bb47",
  skyBlue: "#009ddc",
  amber: "#fcb827",
  burntOrange: "#f6821f",
  crimson: "#e03a3c",
} as const;

export const QUERY_KEYS = {
  USER: ["user"],
  PROFILE: ["profile"],
} as const;
