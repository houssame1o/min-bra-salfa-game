# برا السالفة - Online Multiplayer Game

A real-time multiplayer social deduction game where players join a virtual lobby and try to figure out who is "outside the story"!

## How to Play

1. One player creates a room and gets a room code
2. Other players join using the room code
3. When 5+ players have joined, the supervisor (المراقب) can start the game
4. The supervisor chooses a category and topic
5. One player is randomly chosen to be "outside the story"
6. Players discuss in Discord voice chat to find who's outside!

## Development

To run locally:

```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

<<<<<<< HEAD
=======
Visit `http://localhost:3000` in your browser.

>>>>>>> 5a50760 (Initial commit)
## Deployment

This game can be deployed to Render.com:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Node.js
   - Plan: Free

## Technologies Used

- Node.js
- Express
- Socket.IO
- HTML/CSS/JavaScript
