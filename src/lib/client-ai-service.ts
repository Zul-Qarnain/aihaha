// Client-side AI service that calls the API route
export class ClientAIService {
  private static async callAPI(action: string, params: any): Promise<any> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'AI API call failed');
      }

      return data.result;
    } catch (error) {
      console.error(`AI ${action} error:`, error);
      throw error;
    }
  }

  static async simulatePlayerResponse(context: {
    playerName: string;
    playerHint: string;
    chatHistory: string;
    gameMode: 'find-ai' | 'hide-from-ai';
  }): Promise<string> {
    const fallbackResponses = [
      "Hmm, interesting point...",
      "I'm thinking about this...",
      "That's a good observation.",
      "Let me consider that.",
      "I see what you mean.",
    ];

    try {
      return await this.callAPI('simulatePlayerResponse', context);
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
    const randomPlayer = context.otherPlayers[Math.floor(Math.random() * context.otherPlayers.length)];
    
    try {
      return await this.callAPI('makeVoteDecision', context);
    } catch (error) {
      console.error('Vote decision error:', error);
      return { votedForPlayerId: randomPlayer.id };
    }
  }

  static async generateResponse(
    message: string,
    chatHistory: string = "",
    playerHint?: string
  ): Promise<{
    response: string;
    updatedChatHistory: string;
  }> {
    const defaultResponses = [
      "I'm thinking about what you said...",
      "That's an interesting perspective.",
      "Let me process that...",
      "Good point to consider.",
      "I need a moment to think about this.",
    ];

    try {
      return await this.callAPI('generateResponse', { message, chatHistory, playerHint });
    } catch (error) {
      console.error('Generate response error:', error);
      const fallbackResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      return {
        response: fallbackResponse,
        updatedChatHistory: chatHistory
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
      return await this.callAPI('rememberChatThreads', context);
    } catch (error) {
      console.error('Memory update error:', error);
      return {
        response: "Memory update failed",
        updatedChatHistory: context.existingMemory
      };
    }
  }
}
