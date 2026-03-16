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

export const buildServiceSurface = (color = '#0b2d22') => {
  const rgb = hexToRgb(color);
  const light = {
    r: mix(rgb.r, 255, 0.38),
    g: mix(rgb.g, 255, 0.38),
    b: mix(rgb.b, 255, 0.38)
  };
  const soft = {
    r: mix(rgb.r, 255, 0.14),
    g: mix(rgb.g, 255, 0.14),
    b: mix(rgb.b, 255, 0.14)
  };
  const deep = {
    r: mix(rgb.r, 8, 0.24),
    g: mix(rgb.g, 12, 0.24),
    b: mix(rgb.b, 24, 0.24)
  };

  return [
    `radial-gradient(circle at 22% 18%, ${toRgba(light, 0.9)} 0%, ${toRgba(light, 0.2)} 28%, rgba(255,255,255,0) 52%)`,
    `linear-gradient(160deg, ${toRgba(light, 0.92)} 0%, ${toRgba(soft, 0.96)} 34%, ${toRgba(rgb, 0.98)} 66%, ${toRgba(deep, 1)} 100%)`
  ].join(', ');
};
