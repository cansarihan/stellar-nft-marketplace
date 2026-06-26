import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NftCard } from "../components/NftCard";
import type { NftItem } from "../lib/market";

const listed: NftItem = {
  id: 1n,
  owner: "CB5ZDO6BPMMWWA3JWOHYEDTMEEY2S37IOEGBXLBS3BJW4MXUODKG4RJ2",
  uri: "ipfs://demo/1.json",
  listing: { seller: "GSELLER", price: 100_000_000n },
};

describe("NftCard", () => {
  it("renders token id and listed price", () => {
    render(<NftCard item={listed} address={null} onAction={() => {}} />);
    expect(screen.getByText("NFT #1")).toBeInTheDocument();
    expect(screen.getByText("10 XLM")).toBeInTheDocument();
  });

  it("shows a Buy button to a non-seller buyer", () => {
    render(<NftCard item={listed} address="GBUYER" onAction={() => {}} />);
    expect(screen.getByRole("button", { name: /buy/i })).toBeInTheDocument();
  });

  it("shows Cancel to the seller instead of Buy", () => {
    render(<NftCard item={listed} address="GSELLER" onAction={() => {}} />);
    expect(
      screen.getByRole("button", { name: /cancel listing/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^buy$/i })).toBeNull();
  });

  it("renders an empty state for unlisted tokens owned by others", () => {
    const unlisted: NftItem = {
      id: 2n,
      owner: "GOTHER",
      uri: "ipfs://demo/2.json",
    };
    render(<NftCard item={unlisted} address="GME" onAction={() => {}} />);
    expect(screen.getByText(/owned by collector/i)).toBeInTheDocument();
  });
});
