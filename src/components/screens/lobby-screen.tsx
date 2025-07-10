
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Users, Bot, BrainCircuit } from 'lucide-react';
import type { GameSettings } from '@/types';

interface LobbyScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

export default function LobbyScreen({ onStartGame }: LobbyScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);
  const aiCount = Math.max(1, Math.floor(playerCount / 5));

  const handleStart = () => {
    onStartGame({ playerCount, aiCount });
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-background font-body fade-in-scale">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center p-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <BrainCircuit className="h-10 w-10 text-primary" />
            <CardTitle className="text-4xl font-bold tracking-tighter text-primary-foreground font-headline">
              Who's the AI?
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Configure your game and get ready to find the impostor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <label className="flex items-center justify-between text-lg font-medium">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Players
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-lg font-medium">
              <span className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Players
              </span>
              <span className="font-bold text-primary">{aiCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              There will be 1 AI for every 5 players to keep things challenging.
            </p>
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
