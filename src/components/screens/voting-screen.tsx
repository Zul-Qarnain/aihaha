"use client";

import { type Player } from "@/types";
import { PlayerGrid } from "../player-grid";
import { Button } from "../ui/button";
import { Check, Vote } from "lucide-react";

interface VotingScreenProps {
  players: Player[];
  onVote: (playerId: string) => void;
  humanVotedFor: string | null;
  onConfirmVote: () => void;
}

export default function VotingScreen({ players, onVote, humanVotedFor, onConfirmVote }: VotingScreenProps) {
  const votedPlayerName = players.find(p => p.id === humanVotedFor)?.name;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 fade-in-scale">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold font-headline text-primary animate-pulse">VOTE NOW</h2>
            <p className="text-muted-foreground mt-2">Who do you think is the AI? Select a player to cast your vote.</p>
        </div>
      
        <div className="w-full max-w-4xl">
            <PlayerGrid players={players} isVotingPhase={true} onVote={onVote} humanVotedFor={humanVotedFor} />
        </div>

        <div className="mt-8 text-center">
            <p className="h-6 mb-2 text-lg">
                {humanVotedFor ? `You are voting for: ${votedPlayerName}` : "Select a player to vote."}
            </p>
            <Button onClick={onConfirmVote} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Check className="mr-2"/>
                Confirm Vote
            </Button>
        </div>
    </div>
  );
}
