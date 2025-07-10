# **App Name**: Who’s the AI?

## Core Features:

- Player Support: Support 5–20 players per game session
- AI Assignment: Randomly assign 1 AI per 5 players
- AI Chat Simulation: Simulate human-like responses using Gemini + Genkit LLM tool, including slang, emojis, occasional spelling errors, realistic typing delays, and memory for ongoing chat threads (per session)
- Real-Time Chat: Typing indicators, Max 15-word messages, Timer (6 minutes), Delayed responses for AIs
- Voting Mechanism: All players vote after timer or early trigger, Display each avatar with a “Vote” overlay, Circular progress bar for vote time
- Outcome Logic: AI wins if not all are detected, Humans win if all AIs are caught, All logic processed securely via Firebase Cloud Functions
- Results Display: Voting screen, Who voted for whom, Reveal AI identities, Win/loss outcome, Game progress/phase indicator at top of screen

## Style Guidelines:

- Dark theme with neon accents
- Font: 'Space Grotesk', sans-serif (modern, techy)
- Minimalist; white or light gray icons for voting and chat actions
- Subtle fade transitions between game phases, Smooth transitions during voting for better engagement