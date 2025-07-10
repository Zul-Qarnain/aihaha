
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
import { HowToVoteDialog } from "@/components/how-to-vote-dialog";

const GAME_DURATION = 360; // 6 minutes
const VOTING_DURATION = 30; // 30 seconds
const KICK_VOTE_THRESHOLD = 3;
const HUMAN_PLAYER_ID = "player_1";

const VOTING_ROUNDS_START_TIMES = [
  GAME_DURATION - 30,  // Round 1 at 00:30 (5:30 left)
  GAME_DURATION - 120, // Round 2 at 02:00 (4:00 left)
  GAME_DURATION - 210, // Round 3 at 03:30 (2:30 left)
];

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
  kickedPlayer: Player | null;
  aiCount: number;
  humanVote: string | null;
  showVoteDialog: boolean;
  currentVotingRound: number;
  hasHumanVotedThisRound: boolean;
}

type Action =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_TYPING"; payload: { playerId: string; isTyping: boolean } }
  | { type: "CAST_VOTE"; payload: Vote }
  | { type: "END_GAME" }
  | { type: "TICK_TIMER" }
  | { type: "SHOW_VOTE_DIALOG"; payload: boolean }
  | { type: "START_VOTING_ROUND" }
  | { type: "END_VOTING_ROUND" }
  | { type: "PROCESS_VOTES" }
  | { type: "KICK_PLAYER"; payload: { playerId: string } }
  | { type: "CLOSE_KICK_DIALOG" }
  | { type: "SET_HUMAN_VOTE"; payload: { playerId: string } };

const initialState: Omit<GameState, 'players' | 'aiCount'> = {
  phase: "CHAT",
  messages: [],
  typingPlayers: new Set(),
  timeLeft: GAME_DURATION,
  votes: [],
  kickedPlayer: null,
  humanVote: null,
  showVoteDialog: false,
  currentVotingRound: 0,
  hasHumanVotedThisRound: false,
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
    case "SHOW_VOTE_DIALOG":
        return { ...state, showVoteDialog: action.payload };
    case "START_VOTING_ROUND":
        return {
            ...state,
            phase: 'VOTING',
            showVoteDialog: false,
            currentVotingRound: state.currentVotingRound + 1,
            votes: [],
            humanVote: null,
            hasHumanVotedThisRound: false,
            timeLeft: state.phase === 'VOTING' ? state.timeLeft : VOTING_DURATION,
        };
    case "END_VOTING_ROUND":
        return { ...state, phase: 'CHAT', timeLeft: state.timeLeft };
    case "PROCESS_VOTES": {
        const voteCounts = state.votes.reduce((acc, vote) => {
            acc[vote.votedForId] = (acc[vote.votedForId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const playerToKick = Object.keys(voteCounts).find(playerId => voteCounts[playerId] >= KICK_VOTE_THRESHOLD);
        
        if (playerToKick) {
             const kickedPlayer = state.players.find(p => p.id === playerToKick)!;
             const newPlayers = state.players.map(p => p.id === playerToKick ? { ...p, status: 'kicked' as const } : p);
             const remainingAiCount = kickedPlayer.isAi ? state.aiCount - 1 : state.aiCount;
             const systemMessage: Message = {
                id: `system_${Date.now()}`,
                player: { id: "system", name: "System", avatar: "", isAi: false, status: 'active' },
                text: `${kickedPlayer.name} has been voted out. They were ${kickedPlayer.isAi ? 'an AI' : 'a Human'}.`,
             }
             return { ...state, kickedPlayer, players: newPlayers, aiCount: remainingAiCount, messages: [...state.messages, systemMessage] };
        }
        return state;
    }
    case "SET_HUMAN_VOTE":
      return { ...state, humanVote: action.payload.playerId, hasHumanVotedThisRound: true };
    case "CAST_VOTE": {
      const otherVotes = state.votes.filter(v => v.voterId !== action.payload.voterId);
      return { ...state, votes: [...otherVotes, action.payload] };
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
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const voteTimerRef = useRef<NodeJS.Timeout>();

  // Main game timer
  useEffect(() => {
    gameTimerRef.current = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
    return () => clearInterval(gameTimerRef.current);
  }, []);

  // Voting round trigger
  useEffect(() => {
    if (state.phase === 'CHAT' && VOTING_ROUNDS_START_TIMES.includes(state.timeLeft)) {
        dispatch({ type: "SHOW_VOTE_DIALOG", payload: true });
    }
  }, [state.timeLeft, state.phase]);

  // Voting round timer & logic
  useEffect(() => {
    if (state.phase === 'VOTING') {
      // AI Voting Logic
      triggerAiVotes();
      
      voteTimerRef.current = setTimeout(() => {
        dispatch({ type: 'PROCESS_VOTES' });
        dispatch({ type: 'END_VOTING_ROUND' });
      }, VOTING_DURATION * 1000);
    }
    return () => clearTimeout(voteTimerRef.current);
  }, [state.phase]);

  // Check for game end conditions
  useEffect(() => {
    const activePlayers = state.players.filter(p => p.status === 'active');
    const activeHumans = activePlayers.filter(p => !p.isAi);

    if (state.aiCount === 0) {
        dispatch({ type: 'END_GAME' });
    } else if (activeHumans.length <= 1) { // AI wins if only one human is left
        dispatch({ type: 'END_GAME' });
    } else if (state.timeLeft === 0 && state.phase !== 'RESULTS') {
        dispatch({ type: 'END_GAME' });
    }

  }, [state.players, state.aiCount, state.timeLeft, state.phase]);

  const handleSendMessage = async (text: string) => {
    const humanPlayer = state.players.find((p) => p.id === HUMAN_PLAYER_ID)!;
    const newMessage: Message = {
      id: `${Date.now()}`,
      player: humanPlayer,
      text,
    };
    dispatch({ type: "ADD_MESSAGE", payload: newMessage });
    triggerAiChatResponses(text);
  };
  
  const triggerAiChatResponses = async (latestMessage: string) => {
    const chatHistory = state.messages
      .map((msg) => `${msg.player.name}: ${msg.text}`)
      .join("\n");

    for (const player of state.players) {
      if (player.isAi && player.status === 'active') {
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
            toast({ title: "AI Error", description: "Could not get AI response.", variant: "destructive"});
            dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: false } });
          }
        }, 500 + Math.random() * 1500);
      }
    }
  };

  const triggerAiVotes = async () => {
    const chatHistory = state.messages.map((msg) => `${msg.player.name}: ${msg.text}`).join("\n");
    for (const player of state.players) {
        if (player.isAi && player.status === 'active') {
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
                    toast({ title: "AI Error", description: "Could not get AI vote.", variant: "destructive"});
                }
            }, 1000 + Math.random() * 4000); // Stagger AI votes
        }
    }
  };

  const handleVote = (votedForId: string) => {
    if (state.hasHumanVotedThisRound) {
        toast({ title: "Already Voted", description: "You can only vote once per round.", variant: "destructive" });
        return;
    }
    dispatch({ type: 'SET_HUMAN_VOTE', payload: { playerId: votedForId }});
    dispatch({ type: 'CAST_VOTE', payload: { voterId: HUMAN_PLAYER_ID, votedForId }});
  };

  const activeHumans = state.players.filter(p => !p.isAi && p.status === 'active');
  const humansWin = state.aiCount === 0;
  const aiWins = !humansWin;

  const getTimerDetails = () => {
    if (state.phase === 'VOTING') {
        return { duration: VOTING_DURATION, time: state.timeLeft, text: `Voting Round ${state.currentVotingRound}` };
    }
    return { duration: GAME_DURATION, time: state.timeLeft, text: 'Chat & Deduce' };
  }

  const timerDetails = getTimerDetails();

  return (
    <div
      className="w-full h-full bg-background text-foreground flex flex-col font-body fade-in"
    >
      <GameHeader 
        phase={state.phase} 
        timeLeft={timerDetails.time} 
        totalDuration={timerDetails.duration}
        round={state.currentVotingRound}
      />
      <div className="flex-1 overflow-hidden">
        {state.phase === "CHAT" || state.phase === 'VOTING' ? (
          <ChatScreen
            players={state.players}
            messages={state.messages}
            typingPlayers={state.typingPlayers}
            onSendMessage={handleSendMessage}
            isVotingEnabled={state.phase === 'VOTING'}
            onVote={handleVote}
            votes={state.votes}
            humanVote={state.humanVote}
            hasHumanVotedThisRound={state.hasHumanVotedThisRound}
          />
        ) : (
          <ResultsScreen
            players={state.players}
            onReturnToLobby={onReturnToLobby}
            humansWin={humansWin}
          />
        )}
      </div>
      <HowToVoteDialog 
        isOpen={state.showVoteDialog}
        onClose={() => dispatch({ type: 'SHOW_VOTE_DIALOG', payload: false })}
        onConfirm={() => dispatch({ type: 'START_VOTING_ROUND' })}
        round={state.currentVotingRound + 1}
      />
      <PlayerKickedDialog 
        player={state.kickedPlayer}
        isOpen={!!state.kickedPlayer}
        onClose={() => dispatch({ type: 'CLOSE_KICK_DIALOG' })}
      />
    </div>
  );
}
