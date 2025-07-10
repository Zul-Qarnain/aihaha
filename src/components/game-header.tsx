
"use client";

import { BrainCircuit, MessageSquare, Vote, Trophy } from "lucide-react";
import { type GamePhase } from "@/types";
import { cn } from "@/lib/utils";
import { CircularProgress } from "./circular-progress";

const phaseDetails: Record<
  GamePhase,
  { text: string; icon: React.ElementType }
> = {
  CHAT: { text: "Chat & Deduce", icon: MessageSquare },
  VOTING: { text: "Cast Your Vote", icon: Vote },
  RESULTS: { text: "Final Results", icon: Trophy },
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

const GAME_DURATION = 360; // 6 minutes
const VOTE_DURATION = 60; // 1 minute

export function GameHeader({
  phase,
  timeLeft,
}: {
  phase: GamePhase;
  timeLeft: number;
}) {
  const PhaseIcon = phaseDetails[phase].icon;
  const totalDuration = phase === 'CHAT' ? GAME_DURATION : VOTE_DURATION;
  const progress = (timeLeft / totalDuration) * 100;

  return (
    <header className="p-4 border-b border-primary/10 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-primary-foreground font-headline">
            Who's the AI?
          </h1>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-card border border-primary/20 p-2 pr-4">
            <CircularProgress 
              progress={progress} 
              size={56} 
              strokeWidth={4} 
              className={cn(
                phase === 'VOTING' ? 'text-destructive' : 'text-primary',
                phase === 'RESULTS' && 'text-primary'
              )}
            >
                <PhaseIcon className="h-5 w-5" />
            </CircularProgress>
            <div className="flex flex-col text-left">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{phaseDetails[phase].text}</span>
                <span className="text-2xl font-bold font-mono text-primary-foreground tabular-nums">
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
      </div>
    </header>
  );
}
