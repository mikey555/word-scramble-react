# lil word game

Compete with up to 4 players to find the longest word.

Try it out at https://www.lilwordgame.com/

![image](https://github.com/user-attachments/assets/bff974b6-b4f0-4566-a50a-bb1d2869c88d)

![image](https://github.com/user-attachments/assets/335d82b6-2351-4046-bbb0-fd152fa11e99)

https://github.com/user-attachments/assets/d59dc31d-4f86-47cb-ba87-3c79ad6bdbe2

## Rules
<ul>
  <li>Find the longest word you can within 60 seconds.</li>
  <li>Longer words = more points.</li>
  <li>The player with the most points after 5 rounds wins.</li>
  <li>Drag to select.</li>
</ul>

## Development
```
// development setup
git clone https://github.com/mikey555/word-scramble-react.git
cd word-scramble-react

// install dependencies
npm install
npm i -g vercel
```
Duplicate `.env.example` and rename `.env`.

Unfortunately there's no documented way to run KV locally with RedisJSON support.
So you'll need to sign up for a [Vercel](https://vercel.com/) Hobby plan with a KV (Redis) storage. Add the four `KV_` env vars to your `.env`.

```
// run tests
npm test

// run in development
vercel dev

// deploy preview
vercel

// deploy prod
vercel deploy
```
Since websocket sessions are confined to a single tab, you can test multiplayer by opening a separate tab or window for each player.

## Key Features
- **Selecting words**: I implemented a custom hook `useSelectionDrag()` using PointerEvents.
- **Real-time multiplayer**: players can interact with a shared board. Built using pub-sub messaging client Ably.
- **Lobby**: players can start a game or join an existing game with a 4-letter room code. Rooms and game state is stored in Redis.

## Tools I Used
- React
- Typescript
- Redis DB for storing game state, rooms
- Tanstack / React Query
- T3: Next.js, tRPC, Tailwind CSS
- Ably pub-sub messaging
- shadcn/ui
- Framer Motion
