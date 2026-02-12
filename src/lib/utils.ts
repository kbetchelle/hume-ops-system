import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sanitize user-generated HTML to prevent XSS attacks. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
