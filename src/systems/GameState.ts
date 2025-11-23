import * as signalR from "@microsoft/signalr";
import { FishData, PlayerData, BulletData } from "../types/GameTypes";
import { FishPathManager } from "./FishPathManager";
import {
  LedgerEntry,
  PlayerLedger,
  TransactionType,
} from "../types/LedgerTypes";

interface StateDelta {
  tick?: number;
  fish?: FishData[];
  bullets?: BulletData[];
  players?: PlayerData[];
  payoutEvents?: Array<{
    fishId: number;
    payout: number;
    playerSlot: number;
  }>;
}

export class GameState {
  private static instance: GameState;

  public connection: signalR.HubConnection | null = null;
  public isConnected: boolean = false;

  // Player data
  public playerAuth: {
    userId: string;
    name: string;
    token: string;
    credits: number;
    isGuest: boolean;
  } | null = null;

  public myPlayerSlot: number | null = null;
  public currentRoomId: string | null = null;

  // Betting system
  public currentBet: number = 10;
  public readonly MIN_BET: number = 10;
  public readonly MAX_BET: number = 200;
  public readonly BET_INCREMENT: number = 10;

  // Game state
  public fish: Map<number, FishData> = new Map();
  public bullets: Map<number, BulletData> = new Map();
  public players: Map<number, PlayerData> = new Map();
  public currentTick: number = 0;

  // Tick synchronization
  public tickDrift: number = 0;
  private lastServerTick: number = 0;
  private readonly TICK_DRIFT_THRESHOLD = 5;

  // Path system
  public fishPathManager: FishPathManager = new FishPathManager();

  // Ledger system - track all player transactions
  private ledgers: Map<number, LedgerEntry[]> = new Map();
  private previousBulletCounts: Map<string, number> = new Map();
  public onLedgerUpdated: ((playerSlot: number) => void) | null = null;

  public onFishSpawned: ((fishId: number, typeId: number) => void) | null =
    null;
  public onFishRemoved: ((fishId: number) => void) | null = null;
  public onPayoutReceived: ((fishId: number, payout: number) => void) | null =
    null;
  public onCreditsChanged: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public async guestLogin(name: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        console.error("Guest login failed:", response.statusText);
        return false;
      }

      const data = await response.json();
      this.playerAuth = {
        userId: data.userId,
        name: data.name,
        token: data.token,
        credits: data.credits,
        isGuest: data.isGuest,
      };

      console.log("Guest login successful:", this.playerAuth);
      return true;
    } catch (error) {
      console.error("Guest login error:", error);
      return false;
    }
  }

  public async connectToSignalR(): Promise<boolean> {
    if (this.isConnected || !this.playerAuth) {
      return this.isConnected;
    }

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("/gamehub", {
          accessTokenFactory: () => this.playerAuth!.token,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupSignalRHandlers();

      await this.connection.start();
      this.isConnected = true;
      console.log("Connected to SignalR game hub");
      return true;
    } catch (error) {
      console.error("SignalR connection failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  public disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
      console.log("Disconnected from SignalR");
    }
  }

  public async joinRoom(roomId: string, seat: number): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
      console.error("Cannot join room: not connected to SignalR");
      return false;
    }

    try {
      await this.connection.invoke("JoinRoom", roomId, seat);
      this.currentRoomId = roomId;
      this.myPlayerSlot = seat;
      console.log(`Joined room ${roomId} at seat ${seat}`);
      return true;
    } catch (error) {
      console.error("Failed to join room:", error);
      return false;
    }
  }

  public reset() {
    this.fish.clear();
    this.bullets.clear();
    this.players.clear();
    this.currentTick = 0;
    this.myPlayerSlot = null;
    this.currentRoomId = null;
    this.fishPathManager.clear();
    this.ledgers.clear();
    this.previousBulletCounts.clear();
  }

  public recordBetTransaction(
    playerSlot: number,
    betAmount: number,
    currentBalance: number,
  ) {
    if (!this.ledgers.has(playerSlot)) {
      this.ledgers.set(playerSlot, []);
    }

    const ledger = this.ledgers.get(playerSlot)!;
    ledger.push({
      timestamp: Date.now(),
      type: TransactionType.BET,
      amount: -betAmount,
      balance: currentBalance,
    });

    if (this.onLedgerUpdated) {
      this.onLedgerUpdated(playerSlot);
    }
  }

  public recordWinTransaction(
    playerSlot: number,
    winAmount: number,
    currentBalance: number,
    fishId: number,
    fishType: number,
    multiplier?: number,
  ) {
    if (!this.ledgers.has(playerSlot)) {
      this.ledgers.set(playerSlot, []);
    }

    const ledger = this.ledgers.get(playerSlot)!;
    ledger.push({
      timestamp: Date.now(),
      type: TransactionType.WIN,
      amount: winAmount,
      balance: currentBalance,
      fishId,
      fishType,
      multiplier,
    });

    if (this.onLedgerUpdated) {
      this.onLedgerUpdated(playerSlot);
    }
  }

  public getPlayerLedger(playerSlot: number): PlayerLedger | null {
    const player = this.players.get(playerSlot);
    if (!player) {
      return null;
    }

    const transactions = this.ledgers.get(playerSlot) || [];
    return {
      playerSlot,
      playerName: player.name,
      transactions: [...transactions],
    };
  }

  public getAllPlayerLedgers(): PlayerLedger[] {
    const ledgers: PlayerLedger[] = [];
    for (const [slot, player] of this.players) {
      const transactions = this.ledgers.get(slot) || [];
      ledgers.push({
        playerSlot: slot,
        playerName: player.name,
        transactions: [...transactions],
      });
    }
    return ledgers;
  }

  private setupSignalRHandlers() {
    if (!this.connection) {
      return;
    }

    this.connection.on("StateDelta", (update: StateDelta) => {
      if (update.tick !== undefined) {
        this.lastServerTick = update.tick;
        this.tickDrift = update.tick - this.currentTick;

        if (Math.abs(this.tickDrift) > this.TICK_DRIFT_THRESHOLD) {
          const adjustment =
            Math.sign(this.tickDrift) * Math.ceil(Math.abs(this.tickDrift) / 2);
          this.currentTick += adjustment;
          this.tickDrift = update.tick - this.currentTick;
          console.log(
            `Tick sync: drift=${this.tickDrift}, adjusted client tick by ${adjustment} to ${this.currentTick}`,
          );
        }
      }

      if (update.fish) {
        const currentFishIds = new Set(this.fish.keys());
        const incomingFishIds = new Set<number>();

        for (const fishData of update.fish) {
          incomingFishIds.add(fishData.id);
          this.updateFish(fishData);
        }

        for (const existingFishId of currentFishIds) {
          if (!incomingFishIds.has(existingFishId)) {
            this.removeFish(existingFishId);
            if (this.onFishRemoved) {
              this.onFishRemoved(existingFishId);
            }
          }
        }
      }

      if (update.bullets) {
        // Track bullet count per player to detect new shots (bets)
        const currentBulletCounts = new Map<string, number>();
        
        for (const bulletData of update.bullets) {
          const playerId = bulletData.playerId;
          currentBulletCounts.set(
            playerId,
            (currentBulletCounts.get(playerId) || 0) + 1,
          );
        }

        // Detect new bullets (shots) for ledger tracking
        for (const [playerId, newCount] of currentBulletCounts) {
          const oldCount = this.previousBulletCounts.get(playerId) || 0;
          const newBullets = newCount - oldCount;

          if (newBullets > 0) {
            // Find player slot by userId
            const player = Array.from(this.players.values()).find(
              (p) => p.userId === playerId,
            );
            if (player) {
              // Record bet transaction for each new bullet
              for (let i = 0; i < newBullets; i++) {
                this.recordBetTransaction(
                  player.slot,
                  player.betValue,
                  player.credits,
                );
              }
            }
          }
        }

        this.previousBulletCounts = currentBulletCounts;
        
        this.bullets.clear();
        for (const bulletData of update.bullets) {
          this.bullets.set(bulletData.id, bulletData);
        }
      }

      if (update.players) {
        for (const playerData of update.players) {
          this.players.set(playerData.slot, playerData);

          if (playerData.slot === this.myPlayerSlot && this.playerAuth) {
            const oldCredits = this.playerAuth.credits;
            const newCredits = playerData.credits;

            if (oldCredits !== newCredits) {
              this.playerAuth.credits = newCredits;
              if (this.onCreditsChanged) {
                this.onCreditsChanged();
              }
            }
          }
        }
      }

      if (update.payoutEvents) {
        for (const event of update.payoutEvents) {
          // Record win transaction for ALL players (not just local player)
          const player = this.players.get(event.playerSlot);
          if (player) {
            this.recordWinTransaction(
              event.playerSlot,
              event.payout,
              player.credits,
              event.fishId,
              0, // Fish type not available in payout event
            );
          }

          // Show payout animation only for local player
          if (event.playerSlot === this.myPlayerSlot && this.onPayoutReceived) {
            this.onPayoutReceived(event.fishId, event.payout);
          }
        }
      }
    });
  }

  private updateFish(fishData: FishData) {
    const isNew = !this.fish.has(fishData.id);

    if (fishData.isNewSpawn && fishData.path) {
      this.fishPathManager.registerFishPath(fishData.id, fishData.path);
      console.log(
        `Registered path for fish ${fishData.id}, type: ${fishData.path.pathType}`,
      );

      if (this.onFishSpawned && isNew) {
        this.onFishSpawned(fishData.id, fishData.type);
      }
    }

    this.fish.set(fishData.id, fishData);
  }

  public getFishPosition(
    fishId: number,
    clientTick: number,
  ): [number, number] | null {
    // Use client-driven tick for deterministic path computation
    const pathPosition = this.fishPathManager.getFishPosition(
      fishId,
      clientTick,
    );

    if (pathPosition) {
      return pathPosition;
    }

    // Fallback to server position if path not available
    const fishData = this.fish.get(fishId);
    if (fishData) {
      return [fishData.x, fishData.y];
    }

    return null;
  }

  public removeFish(fishId: number) {
    this.fish.delete(fishId);
    this.fishPathManager.removeFish(fishId);
  }

  public increaseBet(): boolean {
    if (this.currentBet + this.BET_INCREMENT <= this.MAX_BET) {
      this.currentBet += this.BET_INCREMENT;
      return true;
    }
    return false;
  }

  public decreaseBet(): boolean {
    if (this.currentBet - this.BET_INCREMENT >= this.MIN_BET) {
      this.currentBet -= this.BET_INCREMENT;
      return true;
    }
    return false;
  }
}
