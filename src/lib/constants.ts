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
  olive: "#818807",
  skyBlue: "#6CA2E8",
  amber: "#F28B0C",
  burntOrange: "#F2600C",
  crimson: "#D9310B",
} as const;

export const QUERY_KEYS = {
  USER: ["user"],
  PROFILE: ["profile"],
} as const;
