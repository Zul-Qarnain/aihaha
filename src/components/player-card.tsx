"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Player } from "@/types";
import { Bot, Check, User, Vote as VoteIcon } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isVotingPhase?: boolean;
  isSelected?: boolean;
  onVote?: (playerId: string) => void;
  isResultsPhase?: boolean;
  isRevealedAi?: boolean;
  votesReceived?: Player[];
  humanPlayerId?: string;
  isHumanPlayerCard?: boolean;
}

export function PlayerCard({
  player,
  isVotingPhase = false,
  isSelected = false,
  onVote,
  isResultsPhase = false,
  isRevealedAi = false,
  votesReceived = [],
  humanPlayerId,
  isHumanPlayerCard = false
}: PlayerCardProps) {
  const handleVoteClick = () => {
    if (onVote && !isHumanPlayerCard) {
      onVote(player.id);
    }
  };

  const cardClasses = cn(
    "text-center transition-all duration-300 relative overflow-hidden",
    isVotingPhase && !isHumanPlayerCard && "cursor-pointer hover:shadow-primary/40 hover:shadow-lg hover:-translate-y-1",
    isVotingPhase && isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background",
    isVotingPhase && isHumanPlayerCard && "opacity-50 cursor-not-allowed",
    isResultsPhase && isRevealedAi && "ring-2 ring-destructive",
    isResultsPhase && !isRevealedAi && "ring-2 ring-green-500"
  );

  return (
    <Card className={cardClasses} onClick={handleVoteClick}>
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.isAi ? "robot face" : "futuristic avatar"} />
            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {isResultsPhase && (
             <div className="absolute -bottom-2 -right-2 bg-card p-1 rounded-full border border-border">
                {isRevealedAi ? <Bot className="w-5 h-5 text-destructive" /> : <User className="w-5 h-5 text-green-500" />}
             </div>
          )}
        </div>
        <h3 className="font-bold text-lg font-headline">{player.name}</h3>
        
        {isVotingPhase && !isHumanPlayerCard && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            {isSelected ? (
              <Button variant="ghost" size="lg" className="text-accent bg-accent/10">
                <Check className="mr-2 h-5 w-5" /> Voted
              </Button>
            ) : (
              <Button variant="ghost" size="lg">
                <VoteIcon className="mr-2 h-5 w-5" /> Vote
              </Button>
            )}
          </div>
        )}
        {isResultsPhase && votesReceived.length > 0 && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 items-center">
            <p className="text-xs text-muted-foreground">Voted by:</p>
            <div className="flex -space-x-3">
              {votesReceived.map(voter => (
                <Avatar key={voter.id} className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={voter.avatar} alt={voter.name} />
                  <AvatarFallback>{voter.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
