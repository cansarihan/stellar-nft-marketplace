import { STROOPS_PER_XLM } from "../config";

/** Shorten a Stellar address/contract id for compact display: `GABC…WXYZ`. */
export function shorten(value: string, lead = 4, tail = 4): string {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** Convert a price in stroops (bigint) to a human XLM string. */
export function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const frac = stroops % STROOPS_PER_XLM;
  if (frac === 0n) return whole.toString();
  // trim trailing zeros from the 7-digit fractional part
  const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

/** Convert a human XLM amount (string) to stroops (bigint). Throws on bad input. */
export function xlmToStroops(xlm: string): bigint {
  const trimmed = xlm.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    throw new Error("Enter a valid amount (max 7 decimals)");
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = frac.padEnd(7, "0");
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fracPadded);
}
