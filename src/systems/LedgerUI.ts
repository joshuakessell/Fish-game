import { TransactionLedger, Transaction, TransactionType } from './TransactionLedger';

export class LedgerUI {
  private static instance: LedgerUI;
  private ledger: TransactionLedger;
  private overlay: HTMLDivElement | null = null;
  private isVisible: boolean = false;
  private currentPage: number = 0;
  private readonly ITEMS_PER_PAGE: number = 10;

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

    this.currentPage = 0; // Reset to first page when opening
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

    // Transactions list (non-scrollable, paginated)
    const transactionsContainer = document.createElement('div');
    transactionsContainer.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow: hidden;
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
      // Group transactions: combine shots between kills into single entries
      const groupedTransactions = this.groupTransactions(transactions);

      // Reverse for most recent first
      const reversedTransactions = [...groupedTransactions].reverse();

      // Calculate pagination
      const totalPages = Math.ceil(reversedTransactions.length / this.ITEMS_PER_PAGE);
      const startIndex = this.currentPage * this.ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + this.ITEMS_PER_PAGE, reversedTransactions.length);
      const pageTransactions = reversedTransactions.slice(startIndex, endIndex);

      // Show current page of transactions
      for (const transaction of pageTransactions) {
        transactionsContainer.appendChild(this.createTransactionRow(transaction));
      }

      // Add pagination controls if needed
      if (totalPages > 1) {
        const paginationControls = this.createPaginationControls(totalPages);
        transactionsContainer.appendChild(paginationControls);
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
      // Fish image - map fish type to correct filename
      const fishTypeToFilename: { [key: number]: string } = {
        0: 'clownfish.png',
        1: 'neon_tetra.png',
        2: 'butterflyfish.png',
        6: 'lionfish.png',
        9: 'triggerfish.png',
        12: 'hammerhead_shark.png',
        14: 'giant_manta_ray.png',
        21: 'wave_rider.png',
      };
      
      const fishImg = document.createElement('img');
      const filename = fishTypeToFilename[transaction.fishType] || 'clownfish.png';
      fishImg.src = `assets/fish/${filename}`;
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

  /**
   * Group consecutive SHOT transactions before each KILL into a single entry
   */
  private groupTransactions(transactions: Transaction[]): Transaction[] {
    const grouped: Transaction[] = [];
    let currentShotGroup: Transaction[] = [];

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.SHOT) {
        // Accumulate shots
        currentShotGroup.push(transaction);
      } else if (transaction.type === TransactionType.KILL) {
        // If we have accumulated shots, create a grouped entry
        if (currentShotGroup.length > 0) {
          const totalCost = currentShotGroup.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          const groupedShot: Transaction = {
            id: currentShotGroup[0].id,
            type: TransactionType.SHOT,
            timestamp: currentShotGroup[currentShotGroup.length - 1].timestamp,
            amount: -totalCost,
            balance: currentShotGroup[currentShotGroup.length - 1].balance,
            description: `${currentShotGroup.length} shot${currentShotGroup.length > 1 ? 's' : ''} fired`,
          };
          grouped.push(groupedShot);
          currentShotGroup = [];
        }

        // Add the kill transaction
        grouped.push(transaction);
      }
    }

    // Add any remaining shots at the end
    if (currentShotGroup.length > 0) {
      const totalCost = currentShotGroup.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const groupedShot: Transaction = {
        id: currentShotGroup[0].id,
        type: TransactionType.SHOT,
        timestamp: currentShotGroup[currentShotGroup.length - 1].timestamp,
        amount: -totalCost,
        balance: currentShotGroup[currentShotGroup.length - 1].balance,
        description: `${currentShotGroup.length} shot${currentShotGroup.length > 1 ? 's' : ''} fired`,
      };
      grouped.push(groupedShot);
    }

    return grouped;
  }

  private createPaginationControls(totalPages: number): HTMLDivElement {
    const paginationDiv = document.createElement('div');
    paginationDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 20px;
      padding: 15px;
    `;

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '← Previous';
    prevButton.disabled = this.currentPage === 0;
    prevButton.style.cssText = `
      background: ${this.currentPage === 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 102, 204, 0.8)'};
      border: 2px solid ${this.currentPage === 0 ? '#666' : '#0066cc'};
      color: ${this.currentPage === 0 ? '#999' : '#FFF'};
      font-size: 16px;
      padding: 10px 20px;
      border-radius: 10px;
      cursor: ${this.currentPage === 0 ? 'not-allowed' : 'pointer'};
      transition: all 0.2s;
      font-weight: bold;
    `;
    if (this.currentPage > 0) {
      prevButton.onmouseover = () => {
        prevButton.style.background = 'rgba(0, 136, 238, 1)';
        prevButton.style.transform = 'scale(1.05)';
      };
      prevButton.onmouseout = () => {
        prevButton.style.background = 'rgba(0, 102, 204, 0.8)';
        prevButton.style.transform = 'scale(1)';
      };
      prevButton.onclick = () => {
        this.currentPage--;
        this.refresh();
      };
    }

    // Page indicator
    const pageIndicator = document.createElement('div');
    pageIndicator.textContent = `Page ${this.currentPage + 1} of ${totalPages}`;
    pageIndicator.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #FFD700;
      min-width: 120px;
      text-align: center;
    `;

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next →';
    nextButton.disabled = this.currentPage >= totalPages - 1;
    nextButton.style.cssText = `
      background: ${this.currentPage >= totalPages - 1 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 102, 204, 0.8)'};
      border: 2px solid ${this.currentPage >= totalPages - 1 ? '#666' : '#0066cc'};
      color: ${this.currentPage >= totalPages - 1 ? '#999' : '#FFF'};
      font-size: 16px;
      padding: 10px 20px;
      border-radius: 10px;
      cursor: ${this.currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'};
      transition: all 0.2s;
      font-weight: bold;
    `;
    if (this.currentPage < totalPages - 1) {
      nextButton.onmouseover = () => {
        nextButton.style.background = 'rgba(0, 136, 238, 1)';
        nextButton.style.transform = 'scale(1.05)';
      };
      nextButton.onmouseout = () => {
        nextButton.style.background = 'rgba(0, 102, 204, 0.8)';
        nextButton.style.transform = 'scale(1)';
      };
      nextButton.onclick = () => {
        this.currentPage++;
        this.refresh();
      };
    }

    paginationDiv.appendChild(prevButton);
    paginationDiv.appendChild(pageIndicator);
    paginationDiv.appendChild(nextButton);

    return paginationDiv;
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
