export const formatPesoAmount = (amount) => {
  const numericAmount = Number(amount || 0);

  if (!Number.isFinite(numericAmount)) {
    return '₱0';
  }

  const hasFraction = Math.abs(numericAmount % 1) > Number.EPSILON;

  return `₱${numericAmount.toLocaleString('en-PH', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 2,
  })}`;
};