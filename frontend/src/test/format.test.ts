import { describe, it, expect } from "vitest";
import { shorten, stroopsToXlm, xlmToStroops } from "../lib/format";

describe("stroopsToXlm", () => {
  it("formats whole amounts", () => {
    expect(stroopsToXlm(100_000_000n)).toBe("10");
  });
  it("formats fractional amounts and trims zeros", () => {
    expect(stroopsToXlm(105_000_000n)).toBe("10.5");
    expect(stroopsToXlm(1n)).toBe("0.0000001");
  });
});

describe("xlmToStroops", () => {
  it("parses whole and fractional XLM", () => {
    expect(xlmToStroops("10")).toBe(100_000_000n);
    expect(xlmToStroops("0.5")).toBe(5_000_000n);
  });
  it("round-trips with stroopsToXlm", () => {
    expect(stroopsToXlm(xlmToStroops("12.3456789"))).toBe("12.3456789");
  });
  it("rejects invalid input", () => {
    expect(() => xlmToStroops("abc")).toThrow();
    expect(() => xlmToStroops("1.123456789")).toThrow(); // >7 decimals
  });
});

describe("shorten", () => {
  it("truncates long addresses", () => {
    expect(shorten("GABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("GABC…WXYZ");
  });
  it("leaves short strings intact", () => {
    expect(shorten("GABC")).toBe("GABC");
  });
});
