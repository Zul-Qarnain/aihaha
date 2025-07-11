# AI Deduction Game

This is a Next.js application where players try to figure out who is AI and who is human.

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aihaha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your actual API keys:
   - `GROQ_API_KEY`: Get from [Groq Console](https://console.groq.com/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit `http://localhost:9002`

## Environment Variables

- `GROQ_API_KEY` - Required for AI functionality
- Make sure to never commit `.env` files to version control

## Features

- Real-time chat with AI players
- Voting system to eliminate players
- Multiple game modes
- Leave game functionality

To get started, take a look at src/app/page.tsx.
