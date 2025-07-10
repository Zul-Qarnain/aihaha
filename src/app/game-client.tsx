
"use client";

import { rememberChatThreads } from "@/ai/flows/remember-chat-threads";
import { GameHeader } from "@/components/game-header";
import ChatScreen from "@/components/screens/chat-screen";
import ResultsScreen from "@/components/screens/results-screen";
import VotingScreen from "@/components/screens/voting-screen";
import { useToast } from "@/hooks/use-toast";
import { type GamePhase, type Message, type Player, type Vote, type GameSettings } from "@/types";
import { useEffect, useReducer, useRef, useState } from "react";

const GAME_DURATION = 360; // 6 minutes
const VOTE_DURATION = 60; // 1 minute
const HUMAN_PLAYER_ID = "player_1";

const availablePlayerPool: Omit<Player, 'id' | 'isAi'>[] = [
    { name: 'Cyra', avatar: 'https://placehold.co/128x128/3E54A3/FFFFFF.png', 'data-ai-hint': 'cyborg woman' },
    { name: 'Nexus', avatar: 'https://placehold.co/128x128/F5A623/000000.png', 'data-ai-hint': 'robot face' },
    { name: 'Echo', avatar: 'https://placehold.co/128x128/4A90E2/FFFFFF.png', 'data-ai-hint': 'android portrait' },
    { name: 'Jaxon', avatar: 'https://placehold.co/128x128/9B59B6/FFFFFF.png', 'data-ai-hint': 'male hacker' },
    { name: 'Aria', avatar: 'https://placehold.co/128x128/E74C3C/FFFFFF.png', 'data-ai-hint': 'female spy' },
    { name: 'Silas', avatar: 'https://placehold.co/128x128/16A085/FFFFFF.png', 'data-ai-hint': 'bio engineer' },
    { name: 'Mira', avatar: 'https://placehold.co/128x128/F1C40F/000000.png', 'data-ai-hint': 'hologram girl' },
    { name: 'Orion', avatar: 'https://placehold.co/128x128/2980B9/FFFFFF.png', 'data-ai-hint': 'space captain' },
    { name: 'Luna', avatar: 'https://placehold.co/128x128/8E44AD/FFFFFF.png', 'data-ai-hint': 'techno mage' },
    { name: 'Raptor', avatar: 'https://placehold.co/128x128/C0392B/FFFFFF.png', 'data-ai-hint': 'cyborg dinosaur' },
    { name: 'Zane', avatar: 'https://placehold.co/128x128/27AE60/FFFFFF.png', 'data-ai-hint': 'cyberpunk ninja' },
    { name: 'Vesper', avatar: 'https://placehold.co/128x128/D35400/FFFFFF.png', 'data-ai-hint': 'rogue android' },
    { name: 'Gage', avatar: 'https://placehold.co/128x128/34495E/FFFFFF.png', 'data-ai-hint': 'armored soldier' },
    { name: 'Seraph', avatar: 'https://placehold.co/128x128/7F8C8D/000000.png', 'data-ai-hint': 'angelic robot' },
    { name: 'Cortex', avatar: 'https://placehold.co/128x128/1ABC9C/FFFFFF.png', 'data-ai-hint': 'ai brain' },
    { name: 'Nova', avatar: 'https://placehold.co/128x128/F39C12/000000.png', 'data-ai-hint': 'star traveler' },
    { name: 'Ronin', avatar: 'https://placehold.co/128x128/E67E22/FFFFFF.png', 'data-ai-hint': 'samurai robot' },
    { name: 'Blitz', avatar: 'https://placehold.co/128x128/BDC3C7/000000.png', 'data-ai-hint': 'fast robot' },
    { name: 'Helia', avatar: 'https://placehold.co/128x128/95A5A6/000000.png', 'data-ai-hint': 'sun goddess' },
];

function generatePlayers(playerCount: number, aiCount: number): Player[] {
    const humanPlayer: Player = { id: HUMAN_PLAYER_ID, name: "You", avatar: `https://placehold.co/128x128/7F56D9/FFFFFF.png`, 'data-ai-hint': "futuristic avatar", isAi: false };
    
    // Shuffle and select other players
    const shuffledPool = [...availablePlayerPool].sort(() => 0.5 - Math.random());
    const selectedNpcs = shuffledPool.slice(0, playerCount - 1);
    
    // Assign IDs
    let playersWithoutRoles: Player[] = selectedNpcs.map((p, i) => ({
        ...p,
        id: `player_${i + 2}`,
        isAi: false,
    }));

    // Assign AI roles randomly from the NPCs
    const npcIndices = Array.from(Array(playersWithoutRoles.length).keys());
    const shuffledNpcIndices = npcIndices.sort(() => 0.5 - Math.random());
    const aiIndices = shuffledNpcIndices.slice(0, aiCount);

    playersWithoutRoles = playersWithoutRoles.map((p, i) => ({
        ...p,
        isAi: aiIndices.includes(i),
    }));

    return [humanPlayer, ...playersWithoutRoles];
}


interface GameState {
  phase: GamePhase;
  players: Player[];
  messages: Message[];
  typingPlayers: Set<string>;
  timeLeft: number;
  votes: Vote[];
  humanVotedFor: string | null;
}

type Action =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_TYPING"; payload: { playerId: string; isTyping: boolean } }
  | { type: "START_VOTING" }
  | { type: "CAST_VOTE"; payload: Vote }
  | { type: "END_GAME" }
  | { type: "TICK_TIMER" };

const initialState: Omit<GameState, 'players'> = {
  phase: "CHAT",
  messages: [],
  typingPlayers: new Set(),
  timeLeft: GAME_DURATION,
  votes: [],
  humanVotedFor: null,
};

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_TYPING": {
      const newTypingPlayers = new Set(state.typingPlayers);
      if (action.payload.isTyping) {
        newTypingPlayers.add(action.payload.playerId);
      } else {
        newTypingPlayers.delete(action.payload.playerId);
      }
      return { ...state, typingPlayers: newTypingPlayers };
    }
    case "TICK_TIMER":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case "START_VOTING":
      return {
        ...state,
        phase: "VOTING",
        timeLeft: VOTE_DURATION,
        messages: [
          ...state.messages,
          {
            id: `system_${Date.now()}`,
            player: { id: "system", name: "System", avatar: "", isAi: false },
            text: "Time's up! Please cast your votes.",
          },
        ],
      };
    case "CAST_VOTE":
        return {
            ...state,
            humanVotedFor: action.payload.votedForId
        }
    case "END_GAME": {
      const humanVote = state.humanVotedFor ? [{ voterId: HUMAN_PLAYER_ID, votedForId: state.humanVotedFor }] : [];
      
      // Simulate AI votes (AIs tend to vote for non-AI players to sow confusion)
      const aiPlayers = state.players.filter(p => p.isAi);
      const nonAiPlayers = state.players.filter(p => !p.isAi);
      const aiVotes = aiPlayers.map(ai => {
        // AIs won't vote for other AIs
        const potentialTargets = nonAiPlayers.filter(p => p.id !== ai.id);
        const target = potentialTargets.length > 0 ? potentialTargets[Math.floor(Math.random() * potentialTargets.length)] : state.players[0];
        return { voterId: ai.id, votedForId: target.id };
      });

      // Simulate other human votes
      const otherHumanPlayers = state.players.filter(p => !p.isAi && p.id !== HUMAN_PLAYER_ID);
      const otherHumanVotes = otherHumanPlayers.map(h => {
          const targetPool = state.players.filter(p => p.id !== h.id);
          const target = targetPool[Math.floor(Math.random() * targetPool.length)];
          return { voterId: h.id, votedForId: target.id }
      })

      return { ...state, phase: "RESULTS", votes: [...humanVote, ...aiVotes, ...otherHumanVotes] };
    }
    default:
      return state;
  }
}

interface GameClientProps {
  settings: GameSettings;
  onReturnToLobby: () => void;
}

export default function GameClient({ settings, onReturnToLobby }: GameClientProps) {
  const [players] = useState(() => generatePlayers(settings.playerCount, settings.aiCount));
  
  const [state, dispatch] = useReducer(gameReducer, {
      ...initialState,
      players: players,
  });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (state.timeLeft > 0 && (state.phase === "CHAT" || state.phase === "VOTING")) {
      timerRef.current = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
    } else if (state.timeLeft === 0) {
      if (state.phase === "CHAT") {
        dispatch({ type: "START_VOTING" });
      } else if (state.phase === "VOTING") {
        dispatch({ type: "END_GAME" });
      }
    }
    return () => clearInterval(timerRef.current);
  }, [state.timeLeft, state.phase]);

  const handleSendMessage = async (text: string) => {
    const humanPlayer = state.players.find((p) => p.id === HUMAN_PLAYER_ID)!;
    const newMessage: Message = {
      id: `${Date.now()}`,
      player: humanPlayer,
      text,
    };
    dispatch({ type: "ADD_MESSAGE", payload: newMessage });
    triggerAiResponses(text);
  };
  
  const triggerAiResponses = async (latestMessage: string) => {
    const chatHistory = state.messages
      .map((msg) => `${msg.player.name}: ${msg.text}`)
      .join("\n");

    for (const player of state.players) {
      if (player.isAi) {
        setTimeout(async () => {
          dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: true } });
          
          try {
            const aiResponse = await rememberChatThreads({
                playerId: player.id,
                message: latestMessage,
                chatHistory,
            });

            setTimeout(() => {
                dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: false } });
                const aiMessage: Message = {
                    id: `${Date.now()}`,
                    player,
                    text: aiResponse.response,
                    isAIMessage: true,
                };
                dispatch({ type: "ADD_MESSAGE", payload: aiMessage });
            }, 1000 + Math.random() * 2000); // Realistic typing delay

          } catch (error) {
            console.error("AI response error:", error);
            dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: false } });
            toast({
              title: "AI Error",
              description: "The AI is having trouble responding. Please try again later.",
              variant: "destructive",
            });
          }
        }, 500 + Math.random() * 1500); // Realistic thinking delay
      }
    }
  };

  const handleVote = (votedForId: string) => {
    dispatch({ type: 'CAST_VOTE', payload: { voterId: HUMAN_PLAYER_ID, votedForId }});
  };

  const handleConfirmVote = () => {
    if(!state.humanVotedFor) {
        toast({ title: "No vote cast", description: "Please select a player to vote for.", variant: "destructive" });
        return;
    }
    dispatch({ type: "END_GAME" });
  }

  return (
    <div
      className="w-full h-full bg-background text-foreground flex flex-col font-body fade-in"
    >
      <GameHeader phase={state.phase} timeLeft={state.timeLeft} />
      <div className="flex-1 overflow-hidden">
        {state.phase === "CHAT" && (
          <ChatScreen
            players={state.players}
            messages={state.messages}
            typingPlayers={state.typingPlayers}
            onSendMessage={handleSendMessage}
          />
        )}
        {state.phase === "VOTING" && (
          <VotingScreen
            players={state.players}
            onVote={handleVote}
            onConfirmVote={handleConfirmVote}
            humanVotedFor={state.humanVotedFor}
          />
        )}
        {state.phase === "RESULTS" && (
          <ResultsScreen
            players={state.players}
            votes={state.votes}
            onReturnToLobby={onReturnToLobby}
          />
        )}
      </div>
    </div>
  );
}
