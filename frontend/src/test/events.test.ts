import { describe, it, expect } from "vitest";
import { describeEvent, type MarketEvent } from "../lib/events";

function evt(partial: Partial<MarketEvent>): MarketEvent {
  return {
    id: "0",
    ledger: 1,
    contractId: "C...",
    kind: "unknown",
    topics: [],
    value: null,
    ...partial,
  };
}

describe("describeEvent", () => {
  it("describes a mint", () => {
    expect(describeEvent(evt({ kind: "mint", value: 7n }))).toBe(
      "NFT #7 minted",
    );
  });
  it("describes a listing using the token id topic", () => {
    expect(
      describeEvent(evt({ kind: "listed", topics: ["GSELLER", 3n] })),
    ).toBe("NFT #3 listed");
  });
  it("describes a sale", () => {
    expect(describeEvent(evt({ kind: "sold", topics: ["GBUYER", 3n] }))).toBe(
      "NFT #3 sold",
    );
  });
  it("falls back for unknown events", () => {
    expect(describeEvent(evt({ kind: "unknown" }))).toBe("Contract activity");
  });
});
