import "dotenv/config";

export const config = {
  port: process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 5000,
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  corsOrigin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",

  // JWT
  jwtAccessSecret: process.env["JWT_ACCESS_SECRET"] ?? "shopwave-access-secret-change-me",
  jwtRefreshSecret: process.env["JWT_REFRESH_SECRET"] ?? "shopwave-refresh-secret-change-me",
  accessTokenExpiresIn: process.env["ACCESS_TOKEN_EXPIRES_IN"] ?? "15m",
  refreshTokenExpiresIn: process.env["REFRESH_TOKEN_EXPIRES_IN"] ?? "7d",

  // Refresh token cookie max age (7 days in ms)
  refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000,

  // Payments
  paymentProvider: process.env["PAYMENT_PROVIDER"] ?? "mock",
  paymentWebhookSecret: process.env["PAYMENT_WEBHOOK_SECRET"] ?? "shopwave-mock-secret-key",
  paymentMockSecret: process.env["PAYMENT_MOCK_SECRET"] ?? "shopwave-mock-secret-key",

  // Email
  emailProvider: process.env["EMAIL_PROVIDER"] ?? "mock",
  emailFrom: process.env["EMAIL_FROM"] ?? "ShopWave <noreply@shopwave.com>",
  smtpHost: process.env["SMTP_HOST"],
  smtpPort: process.env["SMTP_PORT"] ? parseInt(process.env["SMTP_PORT"], 10) : 587,
  smtpUser: process.env["SMTP_USER"],
  smtpPassword: process.env["SMTP_PASSWORD"],
  smtpSecure: process.env["SMTP_SECURE"] === "true",
};

export default config;
