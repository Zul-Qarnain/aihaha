"use client";

import { type Player, type Vote } from "@/types";
import { PlayerCard } from "./player-card";
import { ScrollArea } from "./ui/scroll-area";

interface PlayerGridProps {
  players: Player[];
  isVotingPhase?: boolean;
  humanVotedFor?: string | null;
  onVote?: (playerId: string) => void;
  isResultsPhase?: boolean;
  votes?: Vote[];
}

export function PlayerGrid({
  players,
  isVotingPhase = false,
  humanVotedFor,
  onVote,
  isResultsPhase = false,
  votes = [],
}: PlayerGridProps) {
  const humanPlayerId = players.find(p => p.name === 'You')?.id;
  
  return (
    <ScrollArea className="h-full">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
        {players.map((player) => {
            const votesForThisPlayer = isResultsPhase ? 
                votes.filter(v => v.votedForId === player.id)
                    .map(v => players.find(p => p.id === v.voterId)!)
                    .filter(Boolean) : [];
            return (
            <PlayerCard
                key={player.id}
                player={player}
                isVotingPhase={isVotingPhase}
                isSelected={humanVotedFor === player.id}
                onVote={onVote}
                isResultsPhase={isResultsPhase}
                isRevealedAi={isResultsPhase && player.isAi}
                votesReceived={votesForThisPlayer}
                humanPlayerId={humanPlayerId}
                isHumanPlayerCard={player.id === humanPlayerId}
            />
            );
        })}
        </div>
    </ScrollArea>
  );
}
