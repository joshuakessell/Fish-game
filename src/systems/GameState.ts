import * as signalR from '@microsoft/signalr';
import { FishData, PlayerData, BulletData } from '../types/GameTypes';

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
  
  // Game state
  public fish: Map<number, FishData> = new Map();
  public bullets: Map<number, BulletData> = new Map();
  public players: Map<number, PlayerData> = new Map();
  public currentTick: number = 0;
  
  private constructor() {}
  
  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }
  
  public async guestLogin(name: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        console.error('Guest login failed:', response.statusText);
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
      
      console.log('Guest login successful:', this.playerAuth);
      return true;
    } catch (error) {
      console.error('Guest login error:', error);
      return false;
    }
  }
  
  public async connectToSignalR(): Promise<boolean> {
    if (this.isConnected || !this.playerAuth) {
      return this.isConnected;
    }
    
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/gamehub', {
          accessTokenFactory: () => this.playerAuth!.token,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();
      
      await this.connection.start();
      this.isConnected = true;
      console.log('Connected to SignalR game hub');
      return true;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }
  
  public disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
      console.log('Disconnected from SignalR');
    }
  }
  
  public async joinRoom(roomId: string, seat: number): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
      console.error('Cannot join room: not connected to SignalR');
      return false;
    }
    
    try {
      await this.connection.invoke('JoinRoom', roomId, seat);
      this.currentRoomId = roomId;
      this.myPlayerSlot = seat;
      console.log(`Joined room ${roomId} at seat ${seat}`);
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
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
  }
}
