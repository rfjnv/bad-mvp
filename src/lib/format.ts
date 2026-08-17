const NBSP = " ";

export function formatSum(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${sign}${grouped}${NBSP}сум`;
}

export function formatNumber(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

const PHONE_DIGITS_RE = /^998\d{9}$/;

/** Принимает произвольный ввод, возвращает нормализованный +998XXXXXXXXX или null */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.startsWith("8") && normalized.length === 9) {
    normalized = "998" + normalized;
  }
  if (!normalized.startsWith("998")) {
    normalized = "998" + normalized;
  }
  if (!PHONE_DIGITS_RE.test(normalized)) return null;
  return "+" + normalized;
}

export function formatPhoneDisplay(normalized: string): string {
  const digits = normalized.replace(/\D/g, "");
  if (digits.length !== 12) return normalized;
  const code = digits.slice(3, 5);
  const p1 = digits.slice(5, 8);
  const p2 = digits.slice(8, 10);
  const p3 = digits.slice(10, 12);
  return `+998 (${code}) ${p1}-${p2}-${p3}`;
}

/** Маскирует ввод в поле по мере набора: +998 (XX) XXX-XX-XX */
export function maskPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);

  let out = "+998";
  if (digits.length > 0) out += ` (${digits.slice(0, 2)}`;
  if (digits.length >= 2) out += `)`;
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
  return out;
}
