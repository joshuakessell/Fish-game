export enum TransactionType {
  BET = "BET",
  WIN = "WIN",
}

export interface LedgerEntry {
  timestamp: number;
  type: TransactionType;
  amount: number;
  balance: number;
  fishId?: number;
  fishType?: number;
  multiplier?: number;
}

export interface PlayerLedger {
  playerSlot: number;
  playerName: string;
  transactions: LedgerEntry[];
}
