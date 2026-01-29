/**
 * API Request/Response Logger
 * Only logs in development mode
 */

const isDev = import.meta.env.DEV;

interface LogEntry {
  timestamp: string;
  type: "request" | "response" | "error";
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  data?: unknown;
}

class ApiLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  logRequest(method: string, url: string, data?: unknown): void {
    if (!isDev) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      type: "request",
      method: method.toUpperCase(),
      url,
      data,
    };

    this.logs.push(entry);
    this.trimLogs();

    console.groupCollapsed(
      `%c→ ${method.toUpperCase()} %c${url}`,
      "color: #3b82f6; font-weight: bold",
      "color: #6b7280"
    );
    if (data) console.log("Payload:", data);
    console.groupEnd();
  }

  logResponse(
    method: string,
    url: string,
    status: number,
    duration: number,
    data?: unknown
  ): void {
    if (!isDev) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      type: "response",
      method: method.toUpperCase(),
      url,
      status,
      duration,
      data,
    };

    this.logs.push(entry);
    this.trimLogs();

    const statusColor = status >= 400 ? "#ef4444" : "#22c55e";
    console.groupCollapsed(
      `%c← ${status} %c${method.toUpperCase()} %c${url} %c${duration}ms`,
      `color: ${statusColor}; font-weight: bold`,
      "color: #3b82f6",
      "color: #6b7280",
      "color: #9ca3af"
    );
    if (data) console.log("Response:", data);
    console.groupEnd();
  }

  logError(method: string, url: string, error: unknown): void {
    if (!isDev) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      type: "error",
      method: method.toUpperCase(),
      url,
      data: error,
    };

    this.logs.push(entry);
    this.trimLogs();

    console.groupCollapsed(
      `%c✕ ERROR %c${method.toUpperCase()} %c${url}`,
      "color: #ef4444; font-weight: bold",
      "color: #3b82f6",
      "color: #6b7280"
    );
    console.error(error);
    console.groupEnd();
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const apiLogger = new ApiLogger();
