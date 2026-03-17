const TELEGRAM_PHONE_PREFIX = 'tg-';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

export const normalizePhoneNumber = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith(TELEGRAM_PHONE_PREFIX)) {
    return raw;
  }

  const digits = digitsOnly(raw);
  if (!digits) {
    return '';
  }

  if (digits.startsWith('251')) {
    return `+${digits}`;
  }

  if (digits.startsWith('09') && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }

  if (digits.startsWith('9') && digits.length === 9) {
    return `+251${digits}`;
  }

  if (raw.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return raw;
};

export const isValidPhoneNumber = (value = '', { allowBlank = false, allowTelegram = false } = {}) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return allowBlank;
  }

  if (raw.startsWith(TELEGRAM_PHONE_PREFIX)) {
    return allowTelegram && /^tg-\d+$/.test(raw);
  }

  const normalized = normalizePhoneNumber(raw);
  return /^\+\d{8,15}$/.test(normalized);
};

export const formatPhoneInput = (value = '') => {
  const normalized = normalizePhoneNumber(value);
  return normalized.startsWith(TELEGRAM_PHONE_PREFIX) ? '' : normalized;
};
