export const CONVERSION_RATES: Record<string, number> = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  unit: 1,
};

export function toBaseUnit(quantity: number, fromUnit: string): number {
  const rate = CONVERSION_RATES[fromUnit];
  if (!rate) {
    throw new Error(`Unsupported unit: ${fromUnit}`);
  }
  return quantity * rate;
}

export function fromBaseUnit(quantity: number, toUnit: string): number {
  const rate = CONVERSION_RATES[toUnit];
  if (!rate) {
    throw new Error(`Unsupported unit: ${toUnit}`);
  }
  return quantity / rate;
}

export function pricePerOrderedUnit(basePricePerBaseUnit: number, orderedUnit: string): number {
  const rate = CONVERSION_RATES[orderedUnit];
  if (!rate) {
    throw new Error(`Unsupported unit: ${orderedUnit}`);
  }
  return basePricePerBaseUnit * rate;
}

export function getCompatibleUnits(baseUnit: string): string[] {
  switch (baseUnit) {
    case "g":
      return ["g", "kg"];
    case "mL":
      return ["mL", "L"];
    case "unit":
      return ["unit"];
    default:
      return [];
  }
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(num);
}
