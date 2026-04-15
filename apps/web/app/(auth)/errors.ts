type AuthErr = { code?: string; message?: string; status?: number } | null | undefined;

const FRIENDLY: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  USER_NOT_FOUND: "No account matches that email.",
  INVALID_PASSWORD: "That password is incorrect.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  INVALID_TOKEN: "This reset link is invalid or has expired.",
  TOKEN_EXPIRED: "This reset link has expired. Request a new one.",
  FAILED_TO_CREATE_USER: "Could not create the account. Try again.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again."
};

export function mapAuthError(err: AuthErr): string {
  if (!err) return "Something went wrong. Please try again.";
  if (err.code && FRIENDLY[err.code]) return FRIENDLY[err.code];
  if (err.message) {
    // Common better-auth messages that come through without codes
    const m = err.message;
    if (/invalid.*(email|password)/i.test(m))
      return FRIENDLY.INVALID_EMAIL_OR_PASSWORD;
    if (/user.*not.*found/i.test(m)) return FRIENDLY.USER_NOT_FOUND;
    if (/already.*exist/i.test(m)) return FRIENDLY.USER_ALREADY_EXISTS;
    if (/(rate.?limit|too many)/i.test(m)) return FRIENDLY.RATE_LIMITED;
    return m;
  }
  return "Something went wrong. Please try again.";
}
