
"use client";

import { BrainCircuit, MessageSquare, Vote, Trophy, Home } from "lucide-react";
import { type GamePhase } from "@/types";
import { cn } from "@/lib/utils";
import { CircularProgress } from "./circular-progress";
import { Button } from "./ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "./ui/alert-dialog";
import { useState } from "react";

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

export function GameHeader({
  phase,
  timeLeft,
  totalDuration,
  round,
  onLeaveGame,
}: {
  phase: GamePhase;
  timeLeft: number;
  totalDuration: number;
  round: number;
  onLeaveGame?: () => void;
}) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  
  const PhaseIcon = phaseDetails[phase].icon;
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const phaseText = phase === 'VOTING' ? `Voting Round ${round}` : `Chat - Round ${round}`;

  const handleLeaveGame = () => {
    setIsLeaveDialogOpen(false);
    onLeaveGame?.();
  };

  return (
    <header className="p-4 border-b border-primary/10 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-primary-foreground font-headline">
            Who's the AI?
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {onLeaveGame && (
            <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave Game</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave the game? Your progress will be lost and you'll return to the home screen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLeaveGame}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div className="flex items-center gap-3 rounded-lg bg-card border border-primary/20 p-2 pr-4">
            <CircularProgress 
              progress={progress} 
              size={56} 
              strokeWidth={4} 
              className={cn(
                phase === 'VOTING' ? 'text-accent' : 'text-primary',
                phase === 'RESULTS' && 'text-primary'
              )}
            >
                <PhaseIcon className="h-5 w-5" />
            </CircularProgress>
            <div className="flex flex-col text-left">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{phaseText}</span>
                <span className="text-2xl font-bold font-mono text-primary-foreground tabular-nums">
                    {formatTime(timeLeft)}
                </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

    