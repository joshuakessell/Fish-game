import { GameState } from './GameState';

export enum TransactionType {
  SHOT = 'SHOT',
  KILL = 'KILL',
}

export interface Transaction {
  id: number;
  type: TransactionType;
  timestamp: number;
  amount: number;
  balance: number;
  fishId?: number;
  fishType?: number;
  bonus?: number;
  description?: string;
}

export class TransactionLedger {
  private static instance: TransactionLedger;
  private transactions: Transaction[] = [];
  private transactionId: number = 0;
  private gameState: GameState;

  private constructor() {
    this.gameState = GameState.getInstance();
  }

  public static getInstance(): TransactionLedger {
    if (!TransactionLedger.instance) {
      TransactionLedger.instance = new TransactionLedger();
    }
    return TransactionLedger.instance;
  }

  public recordShot(cost: number): void {
    const currentBalance = this.getCurrentBalance();
    const newBalance = currentBalance - cost;

    this.transactions.push({
      id: this.transactionId++,
      type: TransactionType.SHOT,
      timestamp: Date.now(),
      amount: -cost,
      balance: newBalance,
      description: `Shot fired`,
    });

    console.log(`📝 Ledger: Shot fired, -$${cost}, balance: $${newBalance}`);
  }

  public recordKill(fishId: number, fishType: number, payout: number, bonus: number = 1.0): void {
    const currentBalance = this.getCurrentBalance();
    const newBalance = currentBalance + payout;

    this.transactions.push({
      id: this.transactionId++,
      type: TransactionType.KILL,
      timestamp: Date.now(),
      amount: payout,
      balance: newBalance,
      fishId,
      fishType,
      bonus,
      description: `Caught fish type ${fishType}`,
    });

    console.log(
      `📝 Ledger: Kill recorded, +$${payout} (x${bonus}), balance: $${newBalance}`,
    );
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  public getRecentTransactions(count: number): Transaction[] {
    return this.transactions.slice(-count);
  }

  public getTotalShots(): number {
    return this.transactions.filter((t) => t.type === TransactionType.SHOT).length;
  }

  public getTotalKills(): number {
    return this.transactions.filter((t) => t.type === TransactionType.KILL).length;
  }

  public getTotalWagered(): number {
    return this.transactions
      .filter((t) => t.type === TransactionType.SHOT)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  public getTotalWon(): number {
    return this.transactions
      .filter((t) => t.type === TransactionType.KILL)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  public getCurrentBalance(): number {
    // Get current balance from GameState's player data
    const mySlot = this.gameState.myPlayerSlot;
    if (mySlot !== null) {
      const playerData = this.gameState.players.get(mySlot);
      if (playerData) {
        return playerData.credits;
      }
    }

    // Fallback: calculate from transactions if player data not available
    if (this.transactions.length === 0) {
      return this.gameState.playerAuth?.credits || 0;
    }
    return this.transactions[this.transactions.length - 1].balance;
  }

  public getNetProfit(): number {
    return this.getTotalWon() - this.getTotalWagered();
  }

  public getRTP(): number {
    const wagered = this.getTotalWagered();
    if (wagered === 0) return 0;
    return (this.getTotalWon() / wagered) * 100;
  }

  public clear(): void {
    this.transactions = [];
    this.transactionId = 0;
    console.log('📝 Ledger: Cleared all transactions');
  }
}
