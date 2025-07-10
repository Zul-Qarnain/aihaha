
export interface Player {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  status: 'active' | 'kicked';
  'data-ai-hint'?: string;
}

export interface Message {
  id: string;
  player: Player;
  text: string;
  isAIMessage?: boolean;
}

export interface Vote {
  voterId: string;
  votedForId: string;
}

export type GamePhase = 'CHAT' | 'VOTING' | 'RESULTS';

export type GameMode = 'find-ai' | 'hide-from-ai';

export interface GameSettings {
  playerCount: number;
  aiCount: number;
  gameMode: GameMode;
}
