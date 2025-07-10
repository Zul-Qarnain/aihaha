
'use client';

import { useState } from 'react';
import GameClient from './game-client';
import LobbyScreen from '@/components/screens/lobby-screen';
import type { GameSettings } from '@/types';

export default function Home() {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
  };

  const handleReturnToLobby = () => {
    setGameSettings(null);
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      {!gameSettings ? (
        <LobbyScreen onStartGame={handleStartGame} />
      ) : (
        <GameClient settings={gameSettings} onReturnToLobby={handleReturnToLobby} />
      )}
    </main>
  );
}
