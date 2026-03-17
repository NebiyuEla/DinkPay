export const formatNumber = (value = 0) => Number(value || 0).toLocaleString();

export const formatEtb = (value = 0) => `${formatNumber(value)} ETB`;
