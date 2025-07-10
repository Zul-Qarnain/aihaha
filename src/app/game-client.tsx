
"use client";

import { rememberChatThreads } from "@/ai/flows/remember-chat-threads";
import { decideAiVote } from "@/ai/flows/decide-ai-vote";
import { GameHeader } from "@/components/game-header";
import ChatScreen from "@/components/screens/chat-screen";
import ResultsScreen from "@/components/screens/results-screen";
import { useToast } from "@/hooks/use-toast";
import { type GamePhase, type Message, type Player, type Vote, type GameSettings } from "@/types";
import { useEffect, useReducer, useRef, useState } from "react";
import { PlayerKickedDialog } from "@/components/player-kicked-dialog";

const GAME_DURATION = 360; // 6 minutes
const VOTE_DELAY = 30; // 30 seconds
const VOTE_THRESHOLD_PERCENT = 0.4;
const HUMAN_PLAYER_ID = "player_1";

const availablePlayerPool: Omit<Player, 'id' | 'isAi' | 'status'>[] = [
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
    const humanPlayer: Player = { id: HUMAN_PLAYER_ID, name: "You", avatar: `https://placehold.co/128x128/7F56D9/FFFFFF.png`, 'data-ai-hint': "futuristic avatar", isAi: false, status: 'active' };
    
    const shuffledPool = [...availablePlayerPool].sort(() => 0.5 - Math.random());
    const selectedNpcs = shuffledPool.slice(0, playerCount - 1);
    
    let playersWithoutRoles: Player[] = selectedNpcs.map((p, i) => ({
        ...p,
        id: `player_${i + 2}`,
        isAi: false,
        status: 'active',
    }));

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
  isVotingEnabled: boolean;
  kickedPlayer: Player | null;
  aiCount: number;
  humanVote: string | null;
}

type Action =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_TYPING"; payload: { playerId: string; isTyping: boolean } }
  | { type: "CAST_VOTE"; payload: Vote }
  | { type: "END_GAME"; payload: { humansWin: boolean } }
  | { type: "TICK_TIMER" }
  | { type: "ENABLE_VOTING" }
  | { type: "KICK_PLAYER"; payload: { playerId: string } }
  | { type: "CLOSE_KICK_DIALOG" }
  | { type: "SET_HUMAN_VOTE"; payload: { playerId: string } }
  | { type: "RESET_VOTES" };

const initialState: Omit<GameState, 'players' | 'aiCount'> = {
  phase: "CHAT",
  messages: [],
  typingPlayers: new Set(),
  timeLeft: GAME_DURATION,
  votes: [],
  isVotingEnabled: false,
  kickedPlayer: null,
  humanVote: null
};

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_TYPING": {
      const newTypingPlayers = new Set(state.typingPlayers);
      if (action.payload.isTyping) newTypingPlayers.add(action.payload.playerId);
      else newTypingPlayers.delete(action.payload.playerId);
      return { ...state, typingPlayers: newTypingPlayers };
    }
    case "TICK_TIMER": {
        if(state.timeLeft <= 1) {
            return { ...state, phase: 'RESULTS', timeLeft: 0 };
        }
        return { ...state, timeLeft: state.timeLeft - 1 };
    }
    case "ENABLE_VOTING":
      return { ...state, isVotingEnabled: true };
    case "SET_HUMAN_VOTE":
      return { ...state, humanVote: action.payload.playerId };
    case "CAST_VOTE": {
      // Allow changing vote
      const otherVotes = state.votes.filter(v => v.voterId !== action.payload.voterId);
      return { ...state, votes: [...otherVotes, action.payload] };
    }
    case "RESET_VOTES":
      return { ...state, votes: [], humanVote: null };
    case "KICK_PLAYER": {
      const kickedPlayer = state.players.find(p => p.id === action.payload.playerId);
      if (!kickedPlayer) return state;

      const newPlayers = state.players.map(p => p.id === action.payload.playerId ? { ...p, status: 'kicked' as const } : p);
      const remainingAiCount = kickedPlayer.isAi ? state.aiCount - 1 : state.aiCount;
      
      const systemMessage: Message = {
        id: `system_${Date.now()}`,
        player: { id: "system", name: "System", avatar: "", isAi: false, status: 'active' },
        text: `${kickedPlayer.name} has been voted out. They were ${kickedPlayer.isAi ? 'an AI' : 'a Human'}.`,
      }

      return {
          ...state,
          players: newPlayers,
          kickedPlayer,
          aiCount: remainingAiCount,
          messages: [...state.messages, systemMessage]
      };
    }
    case "CLOSE_KICK_DIALOG":
        return {...state, kickedPlayer: null};
    case "END_GAME":
      return { ...state, phase: "RESULTS" };
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
      aiCount: settings.aiCount
  });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout>();

  // Main game timer
  useEffect(() => {
    if (state.phase === "CHAT" && state.timeLeft > 0) {
      timerRef.current = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [state.phase, state.timeLeft]);

  // Enable voting after delay
  useEffect(() => {
    if (state.phase === "CHAT") {
        const votingTimer = setTimeout(() => {
            dispatch({ type: "ENABLE_VOTING" });
        }, VOTE_DELAY * 1000);
        return () => clearTimeout(votingTimer);
    }
  }, [state.phase]);

  // Check for game end conditions
  useEffect(() => {
    const activePlayers = state.players.filter(p => p.status === 'active');
    const activeHumans = activePlayers.filter(p => !p.isAi);

    if (state.aiCount === 0) {
        dispatch({ type: 'END_GAME', payload: { humansWin: true } });
    } else if (activeHumans.length === 0) {
        dispatch({ type: 'END_GAME', payload: { humansWin: false } });
    } else if (state.timeLeft === 0 && state.phase === 'CHAT') {
        dispatch({ type: 'END_GAME', payload: { humansWin: false } });
    }

  }, [state.players, state.aiCount, state.timeLeft, state.phase]);


  // Vote counting and player kicking logic
  useEffect(() => {
    const voteCounts = state.votes.reduce((acc, vote) => {
        acc[vote.votedForId] = (acc[vote.votedForId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const activePlayerCount = state.players.filter(p => p.status === 'active').length;
    const threshold = Math.ceil(activePlayerCount * VOTE_THRESHOLD_PERCENT);

    for (const playerId in voteCounts) {
        if (voteCounts[playerId] >= threshold) {
            dispatch({ type: "KICK_PLAYER", payload: { playerId } });
            dispatch({ type: "RESET_VOTES" });
            break; 
        }
    }
  }, [state.votes, state.players]);


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
      if (player.isAi && player.status === 'active') {
        // Chat response
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
            }, 1000 + Math.random() * 2000);

          } catch (error) {
            console.error("AI response error:", error);
            dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: false } });
          }
        }, 500 + Math.random() * 1500);

        // AI Voting logic
        if (state.isVotingEnabled) {
            setTimeout(async () => {
                try {
                    const otherPlayers = state.players.filter(p => p.id !== player.id && p.status === 'active');
                    const voteDecision = await decideAiVote({
                        aiPlayer: { id: player.id, name: player.name },
                        otherPlayers: otherPlayers.map(p => ({id: p.id, name: p.name })),
                        chatHistory
                    });
                    dispatch({ type: 'CAST_VOTE', payload: { voterId: player.id, votedForId: voteDecision.votedForPlayerId } });
                } catch (error) {
                    console.error("AI vote error:", error);
                }
            }, 3000 + Math.random() * 5000);
        }
      }
    }
  };

  const handleVote = (votedForId: string) => {
    if (votedForId === state.humanVote) { // unvote
        const newVotes = state.votes.filter(v => v.voterId !== HUMAN_PLAYER_ID);
        dispatch({ type: 'RESET_VOTES' }); // Bit of a hack to trigger re-render
        dispatch({ type: 'CAST_VOTE', payload: {voterId: 'temp', votedForId: 'temp'} }); // to clear old votes
        dispatch({ type: 'CAST_VOTE', payload: {voterId: HUMAN_PLAYER_ID, votedForId: ''} }); // to clear old votes
        setTimeout(() => {
            state.votes.forEach(v => dispatch({ type: 'CAST_VOTE', payload: v}));
        }, 10)
        
        return;
    }
    dispatch({ type: 'SET_HUMAN_VOTE', payload: { playerId: votedForId }});
    dispatch({ type: 'CAST_VOTE', payload: { voterId: HUMAN_PLAYER_ID, votedForId }});
  };

  const activeHumans = state.players.filter(p => !p.isAi && p.status === 'active');
  const humansWin = state.aiCount === 0 || (state.phase === 'RESULTS' && state.aiCount === 0);
  const aiWins = activeHumans.length === 0 || (state.phase === 'RESULTS' && state.aiCount > 0);

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
            isVotingEnabled={state.isVotingEnabled}
            onVote={handleVote}
            votes={state.votes}
            humanVote={state.humanVote}
          />
        )}
        {state.phase === "RESULTS" && (
          <ResultsScreen
            players={state.players}
            onReturnToLobby={onReturnToLobby}
            humansWin={humansWin}
          />
        )}
      </div>
      <PlayerKickedDialog 
        player={state.kickedPlayer}
        isOpen={!!state.kickedPlayer}
        onClose={() => dispatch({ type: 'CLOSE_KICK_DIALOG' })}
      />
    </div>
  );
}
