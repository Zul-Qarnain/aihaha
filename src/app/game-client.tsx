
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

const CHAT_DURATION = 90;
const VOTE_DURATION = 30;
const MAX_ROUNDS = 3;
const KICK_VOTE_THRESHOLD = 3;
const MIN_PLAYERS_END_CONDITION = 3;
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

function generatePlayers(settings: GameSettings): Player[] {
    const humanPlayer: Player = { id: HUMAN_PLAYER_ID, name: "You", avatar: `https://placehold.co/128x128/7F56D9/FFFFFF.png`, 'data-ai-hint': "futuristic avatar", isAi: false, status: 'active' };
    
    const shuffledPool = [...availablePlayerPool].sort(() => 0.5 - Math.random());
    const selectedNpcs = shuffledPool.slice(0, settings.playerCount - 1);
    
    let playersWithoutRoles: Player[] = selectedNpcs.map((p, i) => ({
        ...p,
        id: `player_${i + 2}`,
        isAi: false, // Default to human, will be updated based on mode
        status: 'active',
    }));

    if (settings.gameMode === 'find-ai') {
        const npcIndices = Array.from(Array(playersWithoutRoles.length).keys());
        const shuffledNpcIndices = npcIndices.sort(() => 0.5 - Math.random());
        const aiIndices = shuffledNpcIndices.slice(0, settings.aiCount);
        playersWithoutRoles = playersWithoutRoles.map((p, i) => ({
            ...p,
            isAi: aiIndices.includes(i),
        }));
    } else { // 'hide-from-ai' mode
        playersWithoutRoles = playersWithoutRoles.map(p => ({ ...p, isAi: true }));
    }

    return [humanPlayer, ...playersWithoutRoles].sort(() => 0.5 - Math.random());
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
  humanCount: number;
  humanVote: string | null;
  showVoteDialog: boolean;
  currentRound: number;
  hasHumanVotedThisRound: boolean;
  gameMode: 'find-ai' | 'hide-from-ai';
}

type Action =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_TYPING"; payload: { playerId: string; isTyping: boolean } }
  | { type: "CAST_VOTE"; payload: Vote }
  | { type: "END_GAME" }
  | { type: "TICK_TIMER" }
  | { type: "SHOW_VOTE_DIALOG"; payload: boolean }
  | { type: "START_VOTING" }
  | { type: "START_CHAT" }
  | { type: "PROCESS_VOTES" }
  | { type: "CLOSE_KICK_DIALOG" }
  | { type: "SET_HUMAN_VOTE"; payload: { playerId: string } }
  | { type: "UPDATE_AFTER_KICK"; payload: { kickedPlayer: Player; newPlayers: Player[] } };

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
            if (state.phase === 'CHAT') {
                return { ...state, timeLeft: 0, showVoteDialog: true };
            }
            if (state.phase === 'VOTING') {
                return { ...state, timeLeft: 0 };
            }
        }
        return { ...state, timeLeft: state.timeLeft - 1 };
    }
    case "SHOW_VOTE_DIALOG":
        return { ...state, showVoteDialog: action.payload };
    case "START_VOTING":
        return {
            ...state,
            phase: 'VOTING',
            timeLeft: VOTE_DURATION,
            showVoteDialog: false,
            currentRound: state.currentRound + 1,
            votes: [],
            humanVote: null,
            hasHumanVotedThisRound: false,
        };
    case "START_CHAT":
        return { ...state, phase: 'CHAT', timeLeft: CHAT_DURATION, currentRound: state.currentRound, messages: [] };
    case "PROCESS_VOTES": {
        const voteCounts = state.votes.reduce((acc, vote) => {
            acc[vote.votedForId] = (acc[vote.votedForId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        let playerToKickId: string | undefined;
        let maxVotes = 0;

        for (const playerId in voteCounts) {
            if(voteCounts[playerId] >= KICK_VOTE_THRESHOLD && voteCounts[playerId] > maxVotes) {
                playerToKickId = playerId;
                maxVotes = voteCounts[playerId];
            }
        }
        
        if (playerToKickId) {
             const kickedPlayer = state.players.find(p => p.id === playerToKickId)!;
             const newPlayers = state.players.map(p => p.id === playerToKickId ? { ...p, status: 'kicked' as const } : p);
             const systemMessage: Message = {
                id: `system_${Date.now()}`,
                player: { id: "system", name: "System", avatar: "", isAi: false, status: 'active' },
                text: `${kickedPlayer.name} has been voted out. They were ${kickedPlayer.isAi ? 'an AI' : 'a Human'}.`,
             }
             return { ...state, kickedPlayer, players: newPlayers, messages: [...state.messages, systemMessage] };
        }
        return { ...state, kickedPlayer: null };
    }
    case "UPDATE_AFTER_KICK": {
        const { kickedPlayer, newPlayers } = action.payload;
        const newAiCount = kickedPlayer.isAi ? state.aiCount - 1 : state.aiCount;
        const newHumanCount = !kickedPlayer.isAi ? state.humanCount -1 : state.humanCount;

        return {
            ...state,
            players: newPlayers,
            aiCount: newAiCount,
            humanCount: newHumanCount,
            kickedPlayer: null,
        }
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
  const [players] = useState(() => generatePlayers(settings));
  
  const [state, dispatch] = useReducer(gameReducer, {
      phase: "CHAT" as GamePhase,
      messages: [],
      typingPlayers: new Set<string>(),
      timeLeft: CHAT_DURATION,
      votes: [],
      kickedPlayer: null,
      humanVote: null,
      showVoteDialog: false,
      currentRound: 0,
      hasHumanVotedThisRound: false,
      players: players,
      aiCount: players.filter((p: Player) => p.isAi).length,
      humanCount: players.filter((p: Player) => !p.isAi).length,
      gameMode: settings.gameMode,
  });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout>();
  
  // Main game timer
  useEffect(() => {
    timerRef.current = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Phase transition logic
  useEffect(() => {
    if (state.phase === 'CHAT' && state.timeLeft === 0) {
      dispatch({ type: 'SHOW_VOTE_DIALOG', payload: true });
    } else if (state.phase === 'VOTING' && state.timeLeft === 0) {
      dispatch({ type: 'PROCESS_VOTES' });
    }
  }, [state.timeLeft, state.phase]);

  // Game End & Post-Vote Logic
  useEffect(() => {
    if (state.phase !== 'VOTING' || state.timeLeft > 0) return;
  
    // Logic continues in handleCloseKickDialog if a player was kicked
    if (state.kickedPlayer) return;
  
    // If no one was kicked, check end conditions or start next round
    const activePlayersCount = state.players.filter((p: Player) => p.status === 'active').length;
    let shouldEndGame = false;
  
    if (state.gameMode === 'find-ai') {
      if (state.aiCount === 0 || activePlayersCount <= MIN_PLAYERS_END_CONDITION || state.currentRound >= MAX_ROUNDS) {
        shouldEndGame = true;
      }
    } else { // 'hide-from-ai'
      if (state.humanCount === 0 || state.currentRound >= MAX_ROUNDS) {
        shouldEndGame = true;
      }
    }
  
    if (shouldEndGame) {
      dispatch({ type: 'END_GAME' });
    } else {
      dispatch({ type: 'START_CHAT' });
    }
  }, [state.kickedPlayer, state.phase, state.timeLeft]);


  // AI Logic Triggers
  useEffect(() => {
    if (state.phase === 'VOTING' && state.currentRound > 0) {
      triggerAiVotes();
    }
  }, [state.phase, state.currentRound]);


  const handleSendMessage = async (text: string) => {
    const humanPlayer = state.players.find((p: Player) => p.id === HUMAN_PLAYER_ID)!;
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
      .map((msg: Message) => `${msg.player.name}: ${msg.text}`)
      .join("\n");

    for (const player of state.players) {
      if (player.isAi && player.status === 'active') {
        // Add a random chance for AI to not respond to keep the chat more natural
        if (Math.random() > 0.85) continue;

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
            // Don't show toast for overload errors, just fail silently.
            if (!(error instanceof Error && error.message.includes("503"))) {
                 toast({ title: "AI Error", description: "Could not get AI response.", variant: "destructive"});
            }
            dispatch({ type: "SET_TYPING", payload: { playerId: player.id, isTyping: false } });
          }
        }, 500 + Math.random() * 1500);
      }
    }
  };

  const triggerAiVotes = async () => {
    const chatHistory = state.messages.map((msg: Message) => `${msg.player.name}: ${msg.text}`).join("\n");
    for (const player of state.players) {
        if (player.isAi && player.status === 'active') {
             setTimeout(async () => {
                try {
                    const otherPlayers = state.players.filter((p: Player) => p.id !== player.id && p.status === 'active');
                    if (otherPlayers.length > 0) {
                        const voteDecision = await decideAiVote({
                            aiPlayer: { id: player.id, name: player.name },
                            otherPlayers: otherPlayers.map((p: Player) => ({id: p.id, name: p.name, isAi: p.isAi })),
                            chatHistory,
                            gameMode: state.gameMode,
                        });
                        dispatch({ type: 'CAST_VOTE', payload: { voterId: player.id, votedForId: voteDecision.votedForPlayerId } });
                    }
                } catch (error) {
                    console.error("AI vote error:", error);
                     if (!(error instanceof Error && error.message.includes("503"))) {
                        toast({ title: "AI Error", description: "Could not get AI vote.", variant: "destructive"});
                     }
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

  const handleConfirmVoteStart = () => {
    dispatch({ type: 'START_VOTING' });
  };
  
  const handleCloseKickDialog = () => {
    if(!state.kickedPlayer) return;

    // The player data is already updated from PROCESS_VOTES, so we just update counts
    dispatch({type: 'UPDATE_AFTER_KICK', payload: { kickedPlayer: state.kickedPlayer, newPlayers: state.players }})

    const activePlayersCount = state.players.filter((p: Player) => p.status === 'active').length;
    const newAiCount = state.kickedPlayer.isAi ? state.aiCount - 1 : state.aiCount;
    const newHumanCount = !state.kickedPlayer.isAi ? state.humanCount -1 : state.humanCount;

    let shouldEndGame = false;
    if (state.gameMode === 'find-ai') {
        if (newAiCount === 0 || activePlayersCount <= MIN_PLAYERS_END_CONDITION || state.currentRound >= MAX_ROUNDS) {
            shouldEndGame = true;
        }
    } else { // 'hide-from-ai'
        if (newHumanCount === 0 || state.currentRound >= MAX_ROUNDS) {
            shouldEndGame = true;
        }
    }

    if (shouldEndGame) {
        dispatch({ type: 'END_GAME' });
    } else {
        dispatch({ type: 'START_CHAT' });
    }
  }

  const activePlayers = state.players.filter((p: Player) => p.status === 'active');
  
  const getWinCondition = () => {
      if (state.phase !== 'RESULTS') {
          // This is tricky, a better way is to determine win at the point of game end.
          // For now, assume a snapshot guess.
          if (state.gameMode === 'find-ai') {
              return state.aiCount === 0;
          } else { // 'hide-from-ai'
              return state.humanCount > 0;
          }
      }
      // If already in results, use the determined outcome
      if(state.gameMode === 'find-ai') {
        const activeAi = state.players.filter((p: Player) => p.isAi && p.status === 'active').length;
        return activeAi === 0;
      } else { // 'hide-from-ai'
        const activeHumans = state.players.filter((p: Player) => !p.isAi && p.status === 'active').length;
        return activeHumans > 0;
      }
  }
  const humansWin = getWinCondition();


  const getTimerDetails = () => {
    if (state.phase === 'VOTING') {
        return { duration: VOTE_DURATION, time: state.timeLeft, text: `Voting Round ${state.currentRound}` };
    }
    const roundNumber = state.currentRound < MAX_ROUNDS ? state.currentRound + 1 : MAX_ROUNDS;
    return { duration: CHAT_DURATION, time: state.timeLeft, text: `Chat - Round ${roundNumber}` };
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
        round={state.currentRound > 0 ? state.currentRound : 1}
        onLeaveGame={onReturnToLobby}
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
            gameMode={state.gameMode}
          />
        )}
      </div>
      <HowToVoteDialog 
        isOpen={state.showVoteDialog}
        onClose={() => dispatch({ type: 'SHOW_VOTE_DIALOG', payload: false })}
        onConfirm={handleConfirmVoteStart}
        round={state.currentRound + 1}
      />
      <PlayerKickedDialog 
        player={state.kickedPlayer}
        isOpen={!!state.kickedPlayer}
        onClose={handleCloseKickDialog}
      />
    </div>
  );
}

    