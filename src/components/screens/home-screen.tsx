
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Search, UserCheck } from 'lucide-react';
import type { GameMode } from '@/types';

interface HomeScreenProps {
  onModeSelect: (mode: GameMode) => void;
}

export default function HomeScreen({ onModeSelect }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background font-body fade-in-scale">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-primary-foreground font-headline mb-4">
          Who's the AI?
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          A social deduction game of humans versus machines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-6">
        <ModeCard
          icon={Search}
          title="Find the AI"
          description="Play as a human and work together to find the secret AI players hiding among you."
          onSelect={() => onModeSelect('find-ai')}
        />
        <ModeCard
          icon={UserCheck}
          title="Hide from AI"
          description="You are the only human in a game of AIs. Blend in, act natural, and don't let them discover you."
          onSelect={() => onModeSelect('hide-from-ai')}
        />
      </div>
    </div>
  );
}

interface ModeCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    onSelect: () => void;
}

function ModeCard({ icon: Icon, title, description, onSelect }: ModeCardProps) {
    return (
        <Card className="bg-card/50 border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col">
            <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Icon className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end justify-center">
                <Button onClick={onSelect} className="w-full">Select Mode</Button>
            </CardContent>
        </Card>
    )
}
