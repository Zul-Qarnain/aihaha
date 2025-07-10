"use client";

import { type Message, type Player } from "@/types";
import { ChatBox } from "../chat-box";
import { PlayerGrid } from "../player-grid";

interface ChatScreenProps {
  players: Player[];
  messages: Message[];
  typingPlayers: Set<string>;
  onSendMessage: (message: string) => void;
}

export default function ChatScreen({
  players,
  messages,
  typingPlayers,
  onSendMessage,
}: ChatScreenProps) {
  return (
    <div className="h-full grid md:grid-cols-3 gap-6 p-6 overflow-hidden fade-in-scale">
      <div className="md:col-span-1 h-full overflow-hidden">
        <div className="bg-card/50 rounded-lg p-4 h-full flex flex-col border border-primary/10">
          <h2 className="text-lg font-bold mb-4 text-center font-headline text-primary">Players</h2>
          <div className="flex-1 overflow-y-auto">
            <PlayerGrid players={players} />
          </div>
        </div>
      </div>
      <div className="md:col-span-2 h-full overflow-hidden">
        <ChatBox
          messages={messages}
          typingPlayers={typingPlayers}
          allPlayers={players}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}
