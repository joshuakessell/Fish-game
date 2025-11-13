import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { FishData, PlayerData, BulletData } from "../types/GameTypes";
import { FishPathManager } from "./FishPathManager";

interface ServerPlayerState {
  PlayerId: string;
  DisplayName: string;
  Credits: number;
  CannonLevel: number;
  PlayerSlot: number;
  TotalKills: number;
  BetValue: number;
}

// MessagePack sends this as an array with indices [0-9], not object with properties
type StateDelta = [
  number,                    // [0] Tick
  number,                    // [1] RoundNumber
  number,                    // [2] TimeRemainingTicks
  boolean,                   // [3] IsRoundTransitioning
  ServerPlayerState[],       // [4] Players
  FishData[],                // [5] Fish
  BulletData[],              // [6] Projectiles
  any[],                     // [7] ActiveBossSequences
  any[],                     // [8] PendingInteractions
  Array<{ fishId: number; payout: number; playerSlot: number }>  // [9] PayoutEvents
];

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
  public isSynced: boolean = false;
  public tickDrift: number = 0;
  public accumulatorAdjustment: number = 0;
  private lastServerTick: number = 0;
  private readonly TICK_DRIFT_THRESHOLD = 5;

  // Path system
  public fishPathManager: FishPathManager = new FishPathManager();

  public onFishSpawned: ((fishId: number, typeId: number) => void) | null =
    null;
  public onFishRemoved: ((fishId: number) => void) | null = null;
  public onBulletSpawned: ((bulletData: BulletData) => void) | null = null;
  public onBulletRemoved: ((bulletId: number) => void) | null = null;
  public onPayoutEvent: ((fishId: number, payout: number, playerSlot: number, isOwnKill: boolean) => void) | null = null;
  public onPayoutReceived: ((fishId: number, payout: number) => void) | null =
    null;
  public onCreditsChanged: (() => void) | null = null;
  public onTickSnapped: (() => void) | null = null;

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
        .withHubProtocol(new MessagePackHubProtocol())
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
    this.isSynced = false;
    this.tickDrift = 0;
    this.myPlayerSlot = null;
    this.currentRoomId = null;
    this.fishPathManager.clear();
  }

  private setupSignalRHandlers() {
    if (!this.connection) {
      return;
    }

    this.connection.on("StateDelta", (update: StateDelta) => {
      const tick = update[0];
      const players = update[4];
      const fish = update[5];
      const projectiles = update[6];
      const payoutEvents = update[9];

      if (tick !== undefined) {
        this.lastServerTick = tick;
        this.tickDrift = tick - this.currentTick;

        if (!this.isSynced) {
          this.currentTick = tick;
          this.isSynced = true;
          this.tickDrift = 0;
          if (this.onTickSnapped) {
            this.onTickSnapped();
          }
          console.log(`Tick snapped to server tick on first sync: ${this.currentTick}`);
        } else if (Math.abs(this.tickDrift) > this.TICK_DRIFT_THRESHOLD) {
          this.currentTick = tick;
          this.tickDrift = 0;
          if (this.onTickSnapped) {
            this.onTickSnapped();
          }
          console.log(`Tick snapped to server tick due to large drift: ${this.currentTick}`);
        }

        // Apply gentle drift correction AFTER snap check
        if (this.isSynced && Math.abs(this.tickDrift) <= 5) {
          const driftMs = this.tickDrift * (1000 / 30);
          this.accumulatorAdjustment = driftMs * 0.2;
        } else {
          this.accumulatorAdjustment = 0;
        }
      }

      // CRITICAL: Process payout events BEFORE fish removals
      // This ensures reward animations can capture fish positions before sprites are destroyed
      if (payoutEvents && payoutEvents.length > 0) {
        for (const event of payoutEvents) {
          const isOwnKill = event.playerSlot === this.myPlayerSlot;
          
          if (this.onPayoutEvent) {
            this.onPayoutEvent(event.fishId, event.payout, event.playerSlot, isOwnKill);
          }
          
          if (isOwnKill && this.onPayoutReceived) {
            this.onPayoutReceived(event.fishId, event.payout);
          }
        }
      }

      if (fish && fish.length > 0) {
        console.log(`📦 Received ${fish.length} fish in StateDelta`);
        const currentFishIds = new Set(this.fish.keys());
        const incomingFishIds = new Set<number>();

        for (const fishData of fish) {
          incomingFishIds.add(fishData[0]);
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

      if (projectiles && projectiles.length > 0) {
        const currentBulletIds = new Set(this.bullets.keys());
        const incomingBulletIds = new Set<number>();

        for (const bulletData of projectiles) {
          incomingBulletIds.add(bulletData[0]);
          const isNew = !this.bullets.has(bulletData[0]);
          
          this.bullets.set(bulletData[0], bulletData);
          
          if (isNew && this.onBulletSpawned) {
            this.onBulletSpawned(bulletData);
          }
        }

        for (const existingBulletId of currentBulletIds) {
          if (!incomingBulletIds.has(existingBulletId)) {
            this.bullets.delete(existingBulletId);
            if (this.onBulletRemoved) {
              this.onBulletRemoved(existingBulletId);
            }
          }
        }
      }

      if (players && players.length > 0) {
        for (const serverPlayer of players) {
          const playerData: PlayerData = {
            slot: serverPlayer.PlayerSlot,
            userId: serverPlayer.PlayerId,
            name: serverPlayer.DisplayName,
            credits: serverPlayer.Credits,
            betValue: serverPlayer.BetValue
          };
          
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
    });
  }


  private updateFish(fishData: FishData) {
    const isNew = !this.fish.has(fishData[0]);
    console.log(`🔄 Updating fish ${fishData[0]} (type ${fishData[1]}), isNew=${isNew}, hasPath=${!!fishData[4]}, pos=(${fishData[2]}, ${fishData[3]})`);

    // Store fish data BEFORE triggering spawn callback
    this.fish.set(fishData[0], fishData);

    // Only register path if fish doesn't have one yet (prevents re-registration every tick)
    if (fishData[4] && !this.fishPathManager.hasFishPath(fishData[0])) {
      this.fishPathManager.registerFishPath(fishData[0], fishData[4]);
      console.log(
        `Registered path for fish ${fishData[0]}, type: ${fishData[4].pathType}`,
      );
    }

    if (isNew && this.onFishSpawned) {
      console.log(`🎯 Calling onFishSpawned for fish ${fishData[0]}, type ${fishData[1]}`);
      this.onFishSpawned(fishData[0], fishData[1]);
    } else if (isNew && !this.onFishSpawned) {
      console.warn(`⚠️ New fish ${fishData[0]} but no onFishSpawned callback set!`);
    }
  }

  public getFishPosition(
    fishId: number,
    clientTick: number,
  ): [number, number] | null {
    // Use ONLY client-driven tick for deterministic path computation
    const pathPosition = this.fishPathManager.getFishPosition(
      fishId,
      clientTick,
    );

    if (pathPosition) {
      return pathPosition;
    }

    // No fallback - if no path, fish shouldn't be rendered
    // This ensures 100% deterministic movement
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

  public deductShotCost(): void {
    if (this.playerAuth) {
      this.playerAuth.credits -= this.currentBet;
      if (this.onCreditsChanged) {
        this.onCreditsChanged();
      }
    }
  }
}
