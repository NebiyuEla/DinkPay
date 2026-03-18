const normalizeDiscountPercent = (value = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(99, Math.max(0, Math.round(parsed * 100) / 100));
};

export const getServiceDiscountPercent = (service) => normalizeDiscountPercent(service?.discountPercent);

export const calculateDiscountedAmount = (amount = 0, discountPercent = 0) => {
  const numericAmount = Number(amount || 0);
  const normalizedDiscount = normalizeDiscountPercent(discountPercent);

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  if (normalizedDiscount <= 0) {
    return numericAmount;
  }

  return Math.max(0.01, Math.round(numericAmount * (1 - normalizedDiscount / 100) * 100) / 100);
};

export const decoratePlanWithDiscount = (service, plan = {}) => {
  const originalPrice = Number(plan?.originalPrice ?? plan?.price ?? 0);
  const discountPercent = getServiceDiscountPercent(service);
  const discountedPrice = calculateDiscountedAmount(originalPrice, discountPercent);
  const hasDiscount = discountPercent > 0 && discountedPrice < originalPrice;

  return {
    ...plan,
    originalPrice,
    price: hasDiscount ? discountedPrice : originalPrice,
    discountPercent,
    hasDiscount
  };
};

export const applyServiceDiscounts = (services = []) =>
  (services || []).map((service) => {
    const discountPercent = getServiceDiscountPercent(service);

    return {
      ...service,
      discountPercent,
      plans: (service?.plans || []).map((plan) => decoratePlanWithDiscount({ discountPercent }, plan))
    };
  });
