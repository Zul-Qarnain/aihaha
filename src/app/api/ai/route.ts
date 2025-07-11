import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;
    
    switch (action) {
      case 'simulatePlayerResponse':
        result = await AIService.simulatePlayerResponse(params);
        break;
      case 'makeVoteDecision':
        result = await AIService.makeVoteDecision(params);
        break;
      case 'generateResponse':
        result = await AIService.generateResponse(params.message, params.chatHistory, params.playerHint);
        break;
      case 'rememberChatThreads':
        result = await AIService.rememberChatThreads(params);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ 
      error: 'AI service failed',
      fallback: true 
    }, { status: 500 });
  }
}
