/**
 * Security, Input Sanitization, and Rate-Limiting Utilities
 */

const COOLDOWN_STORAGE_PREFIX = 'infinity_cooldown_';

/**
 * Escapes HTML special characters to prevent XSS in rendered or stored strings.
 */
export function escapeHtml(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips HTML/script tags, dangerous event handlers, and control characters from user input.
 */
export function sanitizeTextInput(input: string, maxLength: number = 300): string {
  if (typeof input !== 'string') return '';
  let cleaned = input
    // Remove script/style blocks completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Strip javascript:/data:/vbscript: schemes and inline event handlers
    .replace(/(?:javascript|data|vbscript)\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    // Remove invisible control characters except normal whitespace
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // Collapse excessive whitespace while preserving single spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }

  return cleaned;
}

/**
 * Normalizes and validates a 10-digit Indian mobile number (^[6-9]\d{9}$).
 */
export function normalizeIndianPhone(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}

/**
 * Persistent client-side cooldown rate-limiter (survives tab switches / reloads).
 */
export function getCooldownRemainingSeconds(
  actionKey: string,
  cooldownMs: number = 30000
): number {
  try {
    const raw = localStorage.getItem(`${COOLDOWN_STORAGE_PREFIX}${actionKey}`);
    if (!raw) return 0;
    const lastTimestamp = Number(raw);
    if (!Number.isFinite(lastTimestamp) || lastTimestamp <= 0) return 0;
    const elapsed = Date.now() - lastTimestamp;
    if (elapsed >= cooldownMs) return 0;
    return Math.ceil((cooldownMs - elapsed) / 1000);
  } catch {
    return 0;
  }
}

export function recordCooldownAction(actionKey: string): void {
  try {
    localStorage.setItem(`${COOLDOWN_STORAGE_PREFIX}${actionKey}`, String(Date.now()));
  } catch {
    // Non-blocking in restricted storage contexts
  }
}
