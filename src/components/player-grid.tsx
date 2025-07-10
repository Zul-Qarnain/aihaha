"use client";

import { type Player, type Vote } from "@/types";
import { PlayerCard } from "./player-card";
import { ScrollArea } from "./ui/scroll-area";

interface PlayerGridProps {
  players: Player[];
  isVotingEnabled?: boolean;
  onVote?: (playerId: string) => void;
  humanVote?: string | null;
  votes?: Vote[];
  isResultsPhase?: boolean;
}

export function PlayerGrid({
  players,
  isVotingEnabled = false,
  onVote,
  humanVote,
  votes = [],
  isResultsPhase = false
}: PlayerGridProps) {
    const voteCounts = votes.reduce((acc, vote) => {
        acc[vote.votedForId] = (acc[vote.votedForId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

  return (
    <ScrollArea className="h-full">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
        {players.map((player) => (
            <PlayerCard
                key={player.id}
                player={player}
                isVotingEnabled={isVotingEnabled}
                onVote={onVote}
                humanVote={humanVote}
                votesReceivedCount={voteCounts[player.id] || 0}
                isRevealed={isResultsPhase || player.status === 'kicked'}
            />
        ))}
        </div>
    </ScrollArea>
  );
}
