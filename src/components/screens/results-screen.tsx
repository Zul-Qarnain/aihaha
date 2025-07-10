
"use client";

import { type GameMode, type Player } from "@/types";
import { Trophy } from "lucide-react";
import { PlayerGrid } from "../player-grid";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { cn } from "@/lib/utils";

interface ResultsScreenProps {
  players: Player[];
  onReturnToLobby: () => void;
  humansWin: boolean;
  gameMode: GameMode;
}

export default function ResultsScreen({ players, onReturnToLobby, humansWin, gameMode }: ResultsScreenProps) {
  
  const getResultMessage = () => {
    if (gameMode === 'find-ai') {
        return humansWin ? "Congratulations! You successfully identified all the AI players." : "The AI managed to deceive the humans. Better luck next time!";
    } else { // hide-from-ai
        return humansWin ? "Incredible! You survived and fooled all the AIs." : "The AI collective mind was too strong. They found you.";
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-8 fade-in-scale">
        <Card className="w-full max-w-md text-center bg-card/80 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-3 text-3xl font-headline">
                    <Trophy className={cn("w-8 h-8", humansWin ? "text-green-500" : "text-destructive")} />
                    {humansWin ? "Humans Win!" : "AI Wins!"}
                </CardTitle>
                 <CardDescription>
                    {getResultMessage()}
                </CardDescription>
            </CardHeader>
        </Card>
        
        <div className="w-full max-w-4xl">
            <h3 className="text-xl font-bold text-center mb-4 font-headline">Final Standings</h3>
            <PlayerGrid players={players} isResultsPhase={true} />
        </div>

        <Button onClick={onReturnToLobby} size="lg" className="bg-primary hover:bg-primary/90">
            Play Again
        </Button>
    </div>
  );
}
