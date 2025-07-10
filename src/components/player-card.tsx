"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Player } from "@/types";
import { Bot, Check, User, Vote as VoteIcon } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isVotingEnabled?: boolean;
  onVote?: (playerId: string) => void;
  humanVote?: string | null;
  votesReceivedCount?: number;
  isRevealed?: boolean;
}

export function PlayerCard({
  player,
  isVotingEnabled = false,
  onVote,
  humanVote,
  votesReceivedCount = 0,
  isRevealed = false
}: PlayerCardProps) {
  const handleVoteClick = () => {
    if (onVote && player.status === 'active' && isVotingEnabled && player.name !== "You") {
      onVote(player.id);
    }
  };

  const isSelectedByHuman = humanVote === player.id;

  const cardClasses = cn(
    "text-center transition-all duration-300 relative overflow-hidden",
    player.status === 'active' && isVotingEnabled && player.name !== "You" && "cursor-pointer hover:shadow-primary/40 hover:shadow-lg hover:-translate-y-1",
    isSelectedByHuman && "ring-2 ring-accent ring-offset-2 ring-offset-background",
    player.status === 'kicked' && "opacity-40 grayscale",
    player.name === "You" && isVotingEnabled && "cursor-not-allowed"
  );
  
  return (
    <Card className={cardClasses} onClick={handleVoteClick}>
      <CardContent className="p-4 flex flex-col items-center gap-2 relative">
        {votesReceivedCount > 0 && (
            <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-pulse-border">
                {votesReceivedCount}
            </div>
        )}
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.isAi ? "robot face" : "futuristic avatar"} />
            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {isRevealed && (
             <div className="absolute -bottom-2 -right-2 bg-card p-1 rounded-full border border-border">
                {player.isAi ? <Bot className="w-5 h-5 text-destructive" /> : <User className="w-5 h-5 text-green-500" />}
             </div>
          )}
        </div>
        <h3 className="font-bold text-lg font-headline">{player.name}</h3>
        
        {player.status === 'active' && isVotingEnabled && player.name !== "You" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            {isSelectedByHuman ? (
              <Button variant="ghost" size="lg" className="text-accent bg-accent/10 pointer-events-none">
                <Check className="mr-2 h-5 w-5" /> Voted
              </Button>
            ) : (
              <Button variant="ghost" size="lg" className="pointer-events-none">
                <VoteIcon className="mr-2 h-5 w-5" /> Vote
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
