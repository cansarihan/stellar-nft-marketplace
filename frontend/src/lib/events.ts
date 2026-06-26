import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { RPC_URL, NFT_CONTRACT_ID, MARKETPLACE_CONTRACT_ID } from "../config";

export type EventKind =
  | "mint"
  | "transfer"
  | "approve"
  | "listed"
  | "sold"
  | "cancelled"
  | "unknown";

export interface MarketEvent {
  id: string;
  ledger: number;
  contractId: string;
  kind: EventKind;
  /** Decoded topic values (after the event name). */
  topics: unknown[];
  /** Decoded event data payload. */
  value: unknown;
  txHash?: string;
}

const KNOWN_KINDS: EventKind[] = [
  "mint",
  "transfer",
  "approve",
  "listed",
  "sold",
  "cancelled",
];

function toKind(raw: unknown): EventKind {
  return KNOWN_KINDS.includes(raw as EventKind) ? (raw as EventKind) : "unknown";
}

/** Safely decode an XDR ScVal into a native JS value. */
function decode(scval: unknown): unknown {
  try {
    return scValToNative(scval as never);
  } catch {
    return null;
  }
}

/**
 * Polls the Soroban RPC `getEvents` endpoint for both contracts and pushes
 * decoded events to a callback. This is the real-time update mechanism: the UI
 * subscribes once and re-renders as on-chain activity arrives.
 */
export class EventStreamer {
  private server: rpc.Server;
  private cursor: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly contractIds = [NFT_CONTRACT_ID, MARKETPLACE_CONTRACT_ID];

  constructor(private intervalMs = 5000) {
    this.server = new rpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith("http://"),
    });
  }

  async start(onEvents: (events: MarketEvent[]) => void): Promise<void> {
    const latest = await this.server.getLatestLedger();
    // look back ~1h of ledgers (5s/ledger) for an initial backfill
    this.cursor = Math.max(1, latest.sequence - 720);
    await this.poll(onEvents);
    this.timer = setInterval(() => {
      void this.poll(onEvents);
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async poll(onEvents: (events: MarketEvent[]) => void): Promise<void> {
    if (this.cursor == null) return;
    try {
      const res = await this.server.getEvents({
        startLedger: this.cursor,
        filters: [{ type: "contract", contractIds: this.contractIds }],
      });

      const parsed = res.events.map((e) => this.parse(e));
      if (parsed.length > 0) onEvents(parsed);

      // advance cursor past the latest ledger we've seen
      this.cursor = res.latestLedger + 1;
    } catch (err) {
      // transient RPC hiccups should not kill the stream
      console.warn("getEvents poll failed:", err);
    }
  }

  private parse(e: rpc.Api.EventResponse): MarketEvent {
    const topics = (e.topic ?? []).map(decode);
    const [name, ...rest] = topics;
    return {
      id: e.id,
      ledger: e.ledger,
      contractId: e.contractId?.toString() ?? "",
      kind: toKind(name),
      topics: rest,
      value: decode(e.value),
      txHash: e.txHash,
    };
  }
}

/** Human-readable, network-agnostic summary line for an event. */
export function describeEvent(e: MarketEvent): string {
  switch (e.kind) {
    case "mint":
      return `NFT #${e.value} minted`;
    case "listed":
      return `NFT #${e.topics[1]} listed`;
    case "sold":
      return `NFT #${e.topics[1]} sold`;
    case "cancelled":
      return `Listing for NFT #${e.topics[1]} cancelled`;
    case "transfer":
      return `NFT #${e.value} transferred`;
    case "approve":
      return `NFT #${e.value} approval updated`;
    default:
      return "Contract activity";
  }
}
