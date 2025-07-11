import { ChatGroq } from "@langchain/groq";

// List of verified Groq models that actually exist
const FALLBACK_MODELS = [
  "llama3-8b-8192",          // Fast and reliable
  "llama3-70b-8192",         // More capable
  "gemma-7b-it",             // Alternative model
  "mixtral-8x7b-32768",      // May still work in some regions
];

// Create groq instance with timeout and error handling
const createGroqInstance = (modelName: string) => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }
  
  return new ChatGroq({
    apiKey: apiKey,
    model: modelName,
    temperature: 0.7,
    timeout: 10000, // 10 second timeout
    maxRetries: 1, // Reduce retries for faster response
  });
};

// Don't create instance at module load time - create it when needed

// Helper function to try multiple models if one fails
async function tryWithFallbacks(prompt: string): Promise<string> {
  // Check if API key is available
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not found in environment variables");
    throw new Error("API key not configured");
  }

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    try {
      const currentGroq = createGroqInstance(FALLBACK_MODELS[i]);
      const result = await currentGroq.invoke(prompt);
      return (result.content as string).trim();
    } catch (error: any) {
      console.warn(`Model ${FALLBACK_MODELS[i]} failed:`, error.message);
      if (i === FALLBACK_MODELS.length - 1) {
        throw error; // All models failed
      }
    }
  }
  throw new Error("All models failed");
}

export class AIService {
  static async generateResponse(
    message: string, 
    chatHistory: string = "",
    playerHint?: string
  ): Promise<{
    response: string;
    updatedChatHistory: string;
  }> {
    // Default responses if AI fails
    const defaultResponses = [
      "I'm thinking about what you said...",
      "That's an interesting perspective.",
      "Let me process that...",
      "Good point to consider.",
      "I need a moment to think about this.",
    ];

    try {
      const prompt = `You are playing a deduction game where players try to figure out who is AI and who is human. ${playerHint ? `Your character hint: ${playerHint}` : ''}

Previous chat history:
${chatHistory}

New message: ${message}

Generate a natural, human-like response that fits your character. Be conversational and try to blend in. Keep responses under 120 characters.

Respond with ONLY the message text, no JSON or formatting.`;

      const response = await tryWithFallbacks(prompt);
      const finalResponse = response || defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      
      const updatedHistory = chatHistory ? 
        `${chatHistory}\n${message}\n${finalResponse}` : 
        `${message}\n${finalResponse}`;
      
      return {
        response: finalResponse,
        updatedChatHistory: updatedHistory
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      const fallbackResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      return {
        response: fallbackResponse,
        updatedChatHistory: chatHistory
      };
    }
  }

  static async simulatePlayerResponse(
    context: {
      playerName: string;
      playerHint: string;
      chatHistory: string;
      gameMode: 'find-ai' | 'hide-from-ai';
    }
  ): Promise<string> {
    // Add immediate fallback responses
    const fallbackResponses = [
      "Hmm, interesting point...",
      "I'm thinking about this...",
      "That's a good observation.",
      "Let me consider that.",
      "I see what you mean.",
    ];

    try {
      const prompt = `You are ${context.playerName} in a deduction game. ${context.playerHint}

Game mode: ${context.gameMode === 'find-ai' ? 'Find the AI players' : 'Hide that you are AI'}

Recent chat:
${context.chatHistory}

Generate a natural response as ${context.playerName}. Be conversational and try to ${
  context.gameMode === 'find-ai' ? 'figure out who the AIs are' : 'blend in as human'
}. Keep it under 100 characters.

Respond with ONLY the message text.`;

      const response = await tryWithFallbacks(prompt);
      return response || fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } catch (error) {
      console.error('Simulate response error:', error);
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  static async makeVoteDecision(context: {
    aiPlayer: { id: string; name: string };
    otherPlayers: { id: string; name: string; isAi: boolean }[];
    chatHistory: string;
    gameMode: 'find-ai' | 'hide-from-ai';
  }): Promise<{ votedForPlayerId: string }> {
    // Always have a fallback vote ready
    const randomPlayer = context.otherPlayers[Math.floor(Math.random() * context.otherPlayers.length)];
    
    try {
      const playerList = context.otherPlayers
        .map(p => `${p.name} (ID: ${p.id})`)
        .join(', ');

      const prompt = `You are ${context.aiPlayer.name} voting in a deduction game.

Game mode: ${context.gameMode}
Other players: ${playerList}

Chat history:
${context.chatHistory}

Based on the conversation, decide who to vote for. ${
  context.gameMode === 'find-ai' 
    ? 'Try to vote for another AI to protect yourself.' 
    : 'Vote strategically to eliminate humans.'
}

Respond with ONLY the player ID (like "player_2"), nothing else.`;

      const result = await tryWithFallbacks(prompt);
      
      // Validate the vote is for a valid player
      const validPlayer = context.otherPlayers.find(p => 
        result.includes(p.id) || result.includes(p.name)
      );
      
      return {
        votedForPlayerId: validPlayer ? validPlayer.id : randomPlayer.id
      };
    } catch (error) {
      console.error('Vote decision error:', error);
      // Return random vote as fallback
      return {
        votedForPlayerId: randomPlayer.id
      };
    }
  }

  static async rememberChatThreads(context: {
    newMessage: string;
    existingMemory: string;
  }): Promise<{
    response: string;
    updatedChatHistory: string;
  }> {
    try {
      const prompt = `Previous memory: ${context.existingMemory}

New message to remember: ${context.newMessage}

Update the memory with this new information. Keep it concise but capture important details.

Respond with ONLY the updated memory text.`;

      const updatedMemory = await tryWithFallbacks(prompt);
      
      return {
        response: "Memory updated",
        updatedChatHistory: updatedMemory
      };
    } catch (error) {
      console.error('Memory update error:', error);
      return {
        response: "Memory update failed",
        updatedChatHistory: context.existingMemory
      };
    }
  }
}
