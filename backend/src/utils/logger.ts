export type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "card",
  "cvv",
  "cookie",
  "jwt",
];

function sanitize(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      k.toLowerCase().includes(sensitive)
    );
    if (isSensitive) {
      sanitized[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      sanitized[k] = sanitize(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export const logger = {
  info(message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logData = meta ? ` ${JSON.stringify(sanitize(meta))}` : "";
    console.log(`[INFO] [${timestamp}] ${message}${logData}`);
  },

  warn(message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logData = meta ? ` ${JSON.stringify(sanitize(meta))}` : "";
    console.warn(`[WARN] [${timestamp}] ${message}${logData}`);
  },

  error(message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logData = meta ? ` ${JSON.stringify(sanitize(meta))}` : "";
    console.error(`[ERROR] [${timestamp}] ${message}${logData}`);
  },

  debug(message: string, meta?: Record<string, any>) {
    if (process.env["NODE_ENV"] === "development" || process.env["DEBUG"]) {
      const timestamp = new Date().toISOString();
      const logData = meta ? ` ${JSON.stringify(sanitize(meta))}` : "";
      console.debug(`[DEBUG] [${timestamp}] ${message}${logData}`);
    }
  },
};

export default logger;
