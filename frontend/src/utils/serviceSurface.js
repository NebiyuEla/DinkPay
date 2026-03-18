const normalizeHex = (value = '#0b2d22') => {
  const hex = String(value).replace('#', '').trim();
  if (hex.length === 3) {
    return hex
      .split('')
      .map((part) => part + part)
      .join('');
  }
  return hex.padEnd(6, '0').slice(0, 6);
};

const hexToRgb = (value) => {
  const hex = normalizeHex(value);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
};

const mix = (base, target, amount) => Math.round(base + (target - base) * amount);

const toRgba = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const getBrightness = ({ r, g, b }) => (r * 299 + g * 587 + b * 114) / 1000;

export const buildServiceTheme = (color = '#0b2d22') => {
  const rgb = hexToRgb(color);
  const isLight = getBrightness(rgb) >= 165;
  const light = {
    r: mix(rgb.r, 255, isLight ? 0.16 : 0.38),
    g: mix(rgb.g, 255, isLight ? 0.16 : 0.38),
    b: mix(rgb.b, 255, isLight ? 0.16 : 0.38)
  };
  const soft = {
    r: mix(rgb.r, 255, isLight ? 0.05 : 0.14),
    g: mix(rgb.g, 255, isLight ? 0.05 : 0.14),
    b: mix(rgb.b, 255, isLight ? 0.05 : 0.14)
  };
  const deep = {
    r: mix(rgb.r, 8, isLight ? 0.04 : 0.24),
    g: mix(rgb.g, 12, isLight ? 0.04 : 0.24),
    b: mix(rgb.b, 24, isLight ? 0.04 : 0.24)
  };

  const surface = [
    `radial-gradient(circle at 22% 18%, ${toRgba(light, 0.9)} 0%, ${toRgba(light, 0.2)} 28%, rgba(255,255,255,0) 52%)`,
    `linear-gradient(160deg, ${toRgba(light, 0.92)} 0%, ${toRgba(soft, 0.96)} 34%, ${toRgba(rgb, 0.98)} 66%, ${toRgba(deep, 1)} 100%)`
  ].join(', ');

  return {
    surface,
    isLight,
    primaryText: isLight ? '#07111f' : '#ffffff',
    secondaryText: isLight ? 'rgba(7,17,31,0.76)' : 'rgba(255,255,255,0.72)',
    mutedText: isLight ? 'rgba(7,17,31,0.62)' : 'rgba(255,255,255,0.56)',
    subtleText: isLight ? 'rgba(7,17,31,0.5)' : 'rgba(255,255,255,0.5)',
    border: isLight ? 'rgba(7,17,31,0.12)' : 'rgba(255,255,255,0.12)',
    softBorder: isLight ? 'rgba(7,17,31,0.1)' : 'rgba(255,255,255,0.08)',
    iconShell: isLight ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
    iconShellBorder: isLight ? 'rgba(7,17,31,0.12)' : 'rgba(255,255,255,0.08)',
    accentText: isLight ? '#0b6440' : '#49FA84',
    shadow: isLight
      ? '0 18px 34px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255,255,255,0.12)'
      : '0 18px 34px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
    overlay: isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 34%, rgba(7,11,24,0.03) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 26%, rgba(7,11,24,0.12) 100%)'
  };
};

export const buildServiceSurface = (color = '#0b2d22') => buildServiceTheme(color).surface;
