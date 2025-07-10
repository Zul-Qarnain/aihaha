"use client";

import { type Player } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function TypingIndicator({ player }: { player: Player }) {
    return (
        <div className="flex items-center gap-3 p-2">
            <Avatar className="w-8 h-8 border border-primary/20">
                <AvatarImage src={player.avatar} />
                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 bg-secondary px-3 py-2 rounded-xl">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300"></span>
            </div>
        </div>
    )
}
