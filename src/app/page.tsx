
'use client';

import { useState } from 'react';
import GameClient from './game-client';
import LobbyScreen from '@/components/screens/lobby-screen';
import type { GameSettings } from '@/types';
import HomeScreen from '@/components/screens/home-screen';

type AppState = 'HOME' | 'LOBBY' | 'GAME';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  const handleModeSelect = (mode: 'find-ai' | 'hide-from-ai') => {
    setGameSettings({ playerCount: 5, aiCount: 1, gameMode: mode }); // Default settings
    setAppState('LOBBY');
  };

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setAppState('GAME');
  };

  const handleReturnToLobby = () => {
    setGameSettings(null);
    setAppState('HOME'); // Go back to home to select a new mode
  };

  const handleReturnToHome = () => {
      setAppState('HOME');
      setGameSettings(null);
  }

  const renderState = () => {
    switch(appState) {
        case 'HOME':
            return <HomeScreen onModeSelect={handleModeSelect} />;
        case 'LOBBY':
            return <LobbyScreen onStartGame={handleStartGame} initialSettings={gameSettings!} onBack={handleReturnToHome} />;
        case 'GAME':
            return <GameClient settings={gameSettings!} onReturnToLobby={handleReturnToLobby} />;
        default:
            return <HomeScreen onModeSelect={handleModeSelect} />;
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      {renderState()}
    </main>
  );
}
