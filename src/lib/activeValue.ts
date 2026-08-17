import { formatNumber } from "./format";

/**
 * Для каждой единицы измерения — «база» сравнения, чтобы цифра оставалась
 * читаемой (МЕ обычно исчисляются тысячами, граммы — единицами и т.д.).
 */
export const UNIT_BASIS: Record<string, number> = {
  "МЕ": 1000,
  "мг": 100,
  "мкг": 100,
  "г": 1,
  "млрд КОЕ": 1,
};

export interface ActiveValueInput {
  activeSubstance: string | null;
  activeAmount: number | null;
  activeUnit: string | null;
  servingsPerPackage: number | null;
  price: number;
}

export interface ActiveValueResult {
  substance: string;
  pricePerBasis: number;
  basis: number;
  unit: string;
}

export function computePricePerUnit(product: ActiveValueInput): ActiveValueResult | null {
  const { activeSubstance, activeAmount, activeUnit, servingsPerPackage, price } = product;
  if (!activeSubstance || !activeAmount || !activeUnit || !servingsPerPackage) return null;
  if (activeAmount <= 0 || servingsPerPackage <= 0) return null;

  const totalAmount = activeAmount * servingsPerPackage;
  const basis = UNIT_BASIS[activeUnit] ?? 1;
  const pricePerBasis = (price / totalAmount) * basis;

  return { substance: activeSubstance, pricePerBasis, basis, unit: activeUnit };
}

export function formatPricePerUnit(result: ActiveValueResult): string {
  const amount = result.basis === 1 ? "1" : formatNumber(result.basis);
  return `${formatNumber(Math.round(result.pricePerBasis))} сум / ${amount} ${result.unit} (${result.substance})`;
}

export function formatPricePerUnitShort(result: ActiveValueResult): string {
  const amount = result.basis === 1 ? "1" : formatNumber(result.basis);
  return `${formatNumber(Math.round(result.pricePerBasis))} сум / ${amount} ${result.unit}`;
}
