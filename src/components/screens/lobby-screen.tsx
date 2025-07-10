
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Users, Bot, BrainCircuit, ArrowLeft } from 'lucide-react';
import type { GameSettings } from '@/types';
import { Badge } from '../ui/badge';

interface LobbyScreenProps {
  initialSettings: GameSettings;
  onStartGame: (settings: GameSettings) => void;
  onBack: () => void;
}

const modeDetails = {
    'find-ai': {
        title: "Mode: Find the AI",
        description: "Uncover the AI players hiding among the humans."
    },
    'hide-from-ai': {
        title: "Mode: Hide from AI",
        description: "You are the only human. Blend in and don't get caught."
    }
}

export default function LobbyScreen({ initialSettings, onStartGame, onBack }: LobbyScreenProps) {
  const [playerCount, setPlayerCount] = useState(initialSettings.playerCount);
  const isFindAiMode = initialSettings.gameMode === 'find-ai';
  const aiCount = isFindAiMode ? Math.max(1, Math.floor(playerCount / 5)) : playerCount - 1;
  const humanCount = isFindAiMode ? playerCount - aiCount : 1;
  
  const currentModeDetails = modeDetails[initialSettings.gameMode];

  const handleStart = () => {
    onStartGame({ 
        playerCount, 
        aiCount: isFindAiMode ? aiCount : playerCount - 1, 
        gameMode: initialSettings.gameMode 
    });
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-background font-body fade-in-scale">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 shadow-2xl shadow-primary/10 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <CardHeader className="text-center p-6 pt-12">
          <Badge variant="outline" className="mx-auto mb-2">{currentModeDetails.title}</Badge>
          <CardTitle className="text-4xl font-bold tracking-tighter text-primary-foreground font-headline">
            Game Lobby
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {currentModeDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <label className="flex items-center justify-between text-lg font-medium">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Players
              </span>
              <span className="font-bold text-primary">{playerCount}</span>
            </label>
            <Slider
              value={[playerCount]}
              onValueChange={(value) => setPlayerCount(value[0])}
              min={5}
              max={20}
              step={1}
            />
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center text-lg font-medium gap-6">
               <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" /> Humans: <span className="font-bold text-primary-foreground">{humanCount}</span>
               </div>
               <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-destructive" /> AIs: <span className="font-bold text-primary-foreground">{aiCount}</span>
               </div>
            </div>
            {isFindAiMode && (
                <p className="text-sm text-muted-foreground">
                    There will be 1 AI for every 5 players to keep things challenging.
                </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6">
          <Button onClick={handleStart} className="w-full" size="lg">
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
