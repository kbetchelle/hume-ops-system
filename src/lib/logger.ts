/**
 * App logger: no-ops in production, forwards to console in development.
 * Use instead of console.log/error/warn in app code so production bundles stay quiet.
 */
const isDev = import.meta.env.DEV;

function noop(): void {}

export const log = isDev ? (...args: unknown[]) => console.log(...args) : noop;
export const warn = isDev ? (...args: unknown[]) => console.warn(...args) : noop;
export const error = isDev ? (...args: unknown[]) => console.error(...args) : noop;

/** Create a logger with a category prefix (e.g. "[ConciergeForm]") */
export function createLogger(category: string) {
  return {
    log: isDev ? (...args: unknown[]) => console.log(category, ...args) : noop,
    warn: isDev ? (...args: unknown[]) => console.warn(category, ...args) : noop,
    error: isDev ? (...args: unknown[]) => console.error(category, ...args) : noop,
  };
}
