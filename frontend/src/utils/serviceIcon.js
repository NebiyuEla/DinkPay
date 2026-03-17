const IMAGE_EXTENSIONS = ['.svg', '.png', '.webp', '.jpg', '.jpeg'];
const warnedMissingIcons = new Set();

const unique = (values) => [...new Set(values.filter(Boolean))];

const normalizeSlug = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hasExtension = (value = '') => /\.[a-z0-9]+$/i.test(String(value).trim());

const isExternalSource = (value = '') => /^(https?:)?\/\//i.test(String(value).trim()) || /^data:/i.test(String(value).trim());

const expandPathVariants = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return [];
  if (isExternalSource(trimmed)) return [trimmed];

  const base = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const candidates = [trimmed, base];

  if (!base.startsWith('/icons/')) {
    const bare = base.replace(/^\/+/, '');
    candidates.push(`/icons/${bare}`);
  }

  return unique(candidates);
};

const withExtensionVariants = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed || isExternalSource(trimmed)) return [trimmed].filter(Boolean);
  if (hasExtension(trimmed)) return expandPathVariants(trimmed);

  return unique(
    expandPathVariants(trimmed).flatMap((candidate) =>
      IMAGE_EXTENSIONS.map((extension) => `${candidate}${extension}`)
    )
  );
};

export const getServiceIconCandidates = (service) => {
  const directIcon = String(service?.icon || '').trim();
  const idSlug = normalizeSlug(service?.id || '');
  const nameSlug = normalizeSlug(service?.name || '');
  const baseTokens = unique([
    idSlug,
    nameSlug,
    ...idSlug.split('-').filter(Boolean),
    ...nameSlug.split('-').filter(Boolean)
  ]);

  const candidates = [];

  if (directIcon) {
    candidates.push(...withExtensionVariants(directIcon));

    const withoutExt = directIcon.replace(/\.[a-z0-9]+$/i, '');
    if (withoutExt !== directIcon) {
      candidates.push(...withExtensionVariants(withoutExt));
    }
  }

  baseTokens.forEach((token) => {
    candidates.push(...withExtensionVariants(`/icons/${token}`));
  });

  return unique(candidates);
};

export const warnMissingServiceIcon = (service, candidates) => {
  const serviceKey = String(service?.id || service?.name || 'unknown-service');
  if (warnedMissingIcons.has(serviceKey)) {
    return;
  }

  warnedMissingIcons.add(serviceKey);
  console.warn(`DINK Pay icon missing for "${serviceKey}". Tried: ${candidates.join(', ')}`);
};
