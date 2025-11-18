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
  private initialBalance: number = 0;

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
    // Get previous balance from last transaction, or use initial balance
    const previousBalance = this.getPreviousBalance();
    const newBalance = previousBalance - cost;

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
    // Get previous balance from last transaction, or use initial balance
    const previousBalance = this.getPreviousBalance();
    const newBalance = previousBalance + payout;

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

  private getPreviousBalance(): number {
    // If we have transactions, use the balance from the last one
    if (this.transactions.length > 0) {
      return this.transactions[this.transactions.length - 1].balance;
    }
    
    // Otherwise, use the initial balance (set when player joins game)
    return this.initialBalance;
  }

  public setInitialBalance(balance: number): void {
    this.initialBalance = balance;
    console.log(`📝 Ledger: Initial balance set to $${balance}`);
  }

  public getCurrentBalance(): number {
    // Return the balance from the last transaction, or initial balance
    if (this.transactions.length > 0) {
      return this.transactions[this.transactions.length - 1].balance;
    }
    return this.initialBalance;
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
    this.initialBalance = 0;
    console.log('📝 Ledger: Cleared all transactions and reset initial balance');
  }
}
