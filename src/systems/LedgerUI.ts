import { TransactionLedger, Transaction, TransactionType } from './TransactionLedger';

export class LedgerUI {
  private static instance: LedgerUI;
  private ledger: TransactionLedger;
  private overlay: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  private constructor() {
    this.ledger = TransactionLedger.getInstance();
  }

  public static getInstance(): LedgerUI {
    if (!LedgerUI.instance) {
      LedgerUI.instance = new LedgerUI();
    }
    return LedgerUI.instance;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    if (this.isVisible) return;

    this.createOverlay();
    this.isVisible = true;
    console.log('📊 Ledger UI opened');
  }

  public hide(): void {
    if (!this.isVisible) return;

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isVisible = false;
    console.log('📊 Ledger UI closed');
  }

  private createOverlay(): void {
    // Remove existing overlay if any
    if (this.overlay) {
      this.overlay.remove();
    }

    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 800px;
      height: 80%;
      max-height: 700px;
      background: linear-gradient(135deg, rgba(0, 26, 51, 0.98) 0%, rgba(0, 77, 122, 0.98) 100%);
      border: 3px solid #FFD700;
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      color: #FFF;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      border-bottom: 2px solid rgba(255, 215, 0, 0.5);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h2');
    title.textContent = '🏦 Transaction Ledger';
    title.style.cssText = `
      margin: 0;
      font-size: 28px;
      color: #FFD700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: rgba(255, 0, 0, 0.8);
      border: 2px solid #FFF;
      color: #FFF;
      font-size: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(255, 50, 50, 1)';
      closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'rgba(255, 0, 0, 0.8)';
      closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Stats section
    const stats = this.createStatsSection();

    // Transactions list (scrollable)
    const transactionsContainer = document.createElement('div');
    transactionsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 215, 0, 0.8) rgba(0, 0, 0, 0.3);
    `;

    const transactions = this.ledger.getTransactions();
    if (transactions.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No transactions yet. Start playing to see your history!';
      emptyMessage.style.cssText = `
        text-align: center;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 50px;
      `;
      transactionsContainer.appendChild(emptyMessage);
    } else {
      // Show transactions in reverse order (most recent first)
      for (let i = transactions.length - 1; i >= 0; i--) {
        const transaction = transactions[i];
        transactionsContainer.appendChild(this.createTransactionRow(transaction));
      }
    }

    // Assemble overlay
    this.overlay.appendChild(header);
    this.overlay.appendChild(stats);
    this.overlay.appendChild(transactionsContainer);

    document.body.appendChild(this.overlay);
  }

  private createStatsSection(): HTMLDivElement {
    const stats = document.createElement('div');
    stats.style.cssText = `
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.3);
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    `;

    const statItems = [
      { label: 'Total Shots', value: this.ledger.getTotalShots(), color: '#FF6B6B' },
      { label: 'Total Kills', value: this.ledger.getTotalKills(), color: '#4ECDC4' },
      { label: 'Current Balance', value: `$${this.ledger.getCurrentBalance()}`, color: '#FFD700' },
      { label: 'Total Wagered', value: `$${this.ledger.getTotalWagered()}`, color: '#FF6B6B' },
      { label: 'Total Won', value: `$${this.ledger.getTotalWon()}`, color: '#4ECDC4' },
      {
        label: 'Net Profit',
        value: `$${this.ledger.getNetProfit()}`,
        color: this.ledger.getNetProfit() >= 0 ? '#4ECDC4' : '#FF6B6B',
      },
    ];

    statItems.forEach((item) => {
      const statDiv = document.createElement('div');
      statDiv.style.cssText = `
        text-align: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      `;

      const label = document.createElement('div');
      label.textContent = item.label;
      label.style.cssText = `
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 5px;
      `;

      const value = document.createElement('div');
      value.textContent = String(item.value);
      value.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${item.color};
      `;

      statDiv.appendChild(label);
      statDiv.appendChild(value);
      stats.appendChild(statDiv);
    });

    return stats;
  }

  private createTransactionRow(transaction: Transaction): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      border-left: 4px solid ${transaction.type === TransactionType.KILL ? '#4ECDC4' : '#FF6B6B'};
      transition: all 0.2s;
    `;
    row.onmouseover = () => {
      row.style.background = 'rgba(255, 255, 255, 0.1)';
      row.style.transform = 'translateX(5px)';
    };
    row.onmouseout = () => {
      row.style.background = 'rgba(255, 255, 255, 0.05)';
      row.style.transform = 'translateX(0)';
    };

    // Icon/Image column
    const iconCol = document.createElement('div');
    iconCol.style.cssText = `
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      flex-shrink: 0;
    `;

    if (transaction.type === TransactionType.KILL && transaction.fishType !== undefined) {
      // Fish image
      const fishImg = document.createElement('img');
      fishImg.src = `assets/fish-${transaction.fishType}-static.png`;
      fishImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
      `;
      fishImg.onerror = () => {
        // Fallback to emoji if image not found
        fishImg.style.display = 'none';
        iconCol.textContent = '🐟';
        iconCol.style.fontSize = '40px';
      };
      iconCol.appendChild(fishImg);
    } else {
      // Shot icon
      iconCol.textContent = '🎯';
      iconCol.style.fontSize = '40px';
    }

    // Details column
    const detailsCol = document.createElement('div');
    detailsCol.style.cssText = `
      flex: 1;
      margin-right: 15px;
    `;

    const desc = document.createElement('div');
    desc.textContent = transaction.description || 'Transaction';
    desc.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    `;

    const time = document.createElement('div');
    const timeAgo = this.formatTimeAgo(transaction.timestamp);
    time.textContent = timeAgo;
    time.style.cssText = `
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    `;

    detailsCol.appendChild(desc);
    detailsCol.appendChild(time);

    // Amount column
    const amountCol = document.createElement('div');
    amountCol.style.cssText = `
      text-align: right;
      margin-right: 15px;
      flex-shrink: 0;
    `;

    const amount = document.createElement('div');
    const sign = transaction.amount >= 0 ? '+' : '';
    amount.textContent = `${sign}$${Math.abs(transaction.amount)}`;
    amount.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: ${transaction.amount >= 0 ? '#4ECDC4' : '#FF6B6B'};
    `;

    if (transaction.bonus && transaction.bonus !== 1.0) {
      const bonusLabel = document.createElement('div');
      bonusLabel.textContent = `x${transaction.bonus.toFixed(1)} bonus`;
      bonusLabel.style.cssText = `
        font-size: 11px;
        color: #FFD700;
        margin-top: 2px;
      `;
      amountCol.appendChild(amount);
      amountCol.appendChild(bonusLabel);
    } else {
      amountCol.appendChild(amount);
    }

    // Balance column
    const balanceCol = document.createElement('div');
    balanceCol.style.cssText = `
      text-align: right;
      width: 100px;
      flex-shrink: 0;
    `;

    const balanceLabel = document.createElement('div');
    balanceLabel.textContent = 'Balance';
    balanceLabel.style.cssText = `
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 2px;
    `;

    const balance = document.createElement('div');
    balance.textContent = `$${transaction.balance}`;
    balance.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #FFD700;
    `;

    balanceCol.appendChild(balanceLabel);
    balanceCol.appendChild(balance);

    // Assemble row
    row.appendChild(iconCol);
    row.appendChild(detailsCol);
    row.appendChild(amountCol);
    row.appendChild(balanceCol);

    return row;
  }

  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  public refresh(): void {
    if (this.isVisible) {
      this.hide();
      this.show();
    }
  }
}
