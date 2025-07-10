
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type Message, type Player } from "@/types";
import { SendHorizonal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { TypingIndicator } from "./typing-indicator";
import { useToast } from "@/hooks/use-toast";


interface ChatBoxProps {
  messages: Message[];
  typingPlayers: Set<string>;
  allPlayers: Player[];
  onSendMessage: (message: string) => void;
  isChatDisabled?: boolean;
}

export function ChatBox({ messages, typingPlayers, allPlayers, onSendMessage, isChatDisabled = false }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typingPlayers]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isChatDisabled) {
      const wordCount = input.trim().split(/\s+/).length;
      if (wordCount > 15) {
        toast({
            title: "Message too long",
            description: "Please keep your messages to 15 words or less.",
            variant: "destructive"
        })
        return;
      }
      onSendMessage(input);
      setInput("");
    }
  };

  const getPlayerById = (id: string) => allPlayers.find(p => p.id === id);

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-lg border border-primary/10">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.player.name === "You" ? "justify-end" : "justify-start"
              )}
            >
              {message.player.name !== "You" && (
                <Avatar className="w-8 h-8 border border-primary/20">
                  <AvatarImage src={message.player.avatar} />
                  <AvatarFallback>{message.player.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-xs md:max-w-md rounded-xl px-4 py-2", 
                message.player.name === "You" ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}>
                 {message.player.name !== "You" && <p className="text-xs font-bold text-primary">{message.player.name}</p>}
                 <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          {Array.from(typingPlayers).map(playerId => {
            const player = getPlayerById(playerId);
            return player ? <TypingIndicator key={playerId} player={player} /> : null;
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-primary/10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isChatDisabled ? "Chat disabled during voting..." : "Type your message... (15 words max)"}
            className="flex-1 bg-background focus:ring-accent"
            disabled={isChatDisabled}
          />
          <Button type="submit" size="icon" variant="ghost" className="bg-primary/20 hover:bg-primary/40" disabled={isChatDisabled}>
            <SendHorizonal className="h-5 w-5 text-primary" />
          </Button>
        </form>
      </div>
    </div>
  );
}
