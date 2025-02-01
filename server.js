const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');
const { nanoid } = require('nanoid');

function getRandomOutsiders(players, gameType = null) {
    const totalPlayers = players.length;
    
    // Different game types with their probabilities
    const gameTypes = {
        SINGLE: { weight: 50, min: 1, max: 1 },                    // 50% chance - Classic mode with 1 outsider
        MULTIPLE: { weight: 30, min: 2, max: Math.floor(totalPlayers * 0.4) }, // 30% chance - Multiple outsiders (up to 40% of players)
        MAJORITY: { weight: 15, min: Math.ceil(totalPlayers * 0.5), max: totalPlayers - 1 }, // 15% chance - Majority are outsiders
        ALL: { weight: 5, min: totalPlayers, max: totalPlayers }   // 5% chance - Everyone is an outsider!
    };

    // If gameType not specified, randomly select based on weights
    if (!gameType) {
        const totalWeight = Object.values(gameTypes).reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, data] of Object.entries(gameTypes)) {
            random -= data.weight;
            if (random <= 0) {
                gameType = type;
                break;
            }
        }
    }

    const selectedType = gameTypes[gameType];
    
    // Determine number of outsiders for this game
    const numOutsiders = Math.floor(
        Math.random() * (selectedType.max - selectedType.min + 1) + selectedType.min
    );

    // Create array of indices and shuffle it
    const indices = Array.from({ length: totalPlayers }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Select outsider indices
    const outsiderIndices = indices.slice(0, numOutsiders);
    
    console.log(`Game Type: ${gameType}, Players: ${totalPlayers}, Outsiders: ${numOutsiders}`);
    return outsiderIndices;
}

app.use(express.static(path.join(__dirname, 'public')));

// Store game rooms and their states
const rooms = new Map();

io.on('connection', (socket) => {   
    console.log('User connected:', socket.id);

    // Create a new room    
    socket.on('createRoom', (playerName) => {
        const roomCode = nanoid(6).toUpperCase();
        rooms.set(roomCode, {
            players: [{
                id: socket.id,
                name: playerName,
                isSupervisor: true
            }],
            supervisor: socket.id,
            gameStarted: false,
            category: '',
            topic: '',
            outsiders: null
        });

        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, playerId: socket.id });
        io.to(roomCode).emit('updatePlayers', rooms.get(roomCode).players);
    });

    // Join existing room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (room.gameStarted) {
            socket.emit('error', 'Game already in progress');
            return;
        }

        room.players.push({
            id: socket.id,
            name: playerName,
            isSupervisor: false
        });

        socket.join(roomCode);
        socket.emit('joinedRoom', { roomCode, playerId: socket.id });
        io.to(roomCode).emit('updatePlayers', room.players);
    });

    // Start game
    socket.on('startGame', ({ roomCode, category, topic }) => {
        console.log('Starting game in room:', roomCode);
        const room = rooms.get(roomCode);
        if (!room || room.supervisor !== socket.id) return;

        room.gameStarted = true;
        room.category = category;
        room.topic = topic;

        // Get non-supervisor players
        const nonSupervisorPlayers = room.players.filter(p => !p.isSupervisor);

        // Get random outsider indices using our new function
        const outsiderIndices = getRandomOutsiders(nonSupervisorPlayers);
        room.outsiders = outsiderIndices.map(index => nonSupervisorPlayers[index].id);

        // Send roles to players
        room.players.forEach(player => {
            if (player.isSupervisor) {
                // Send supervisor all player roles and game info
                io.to(player.id).emit('gameStarted', {
                    category,
                    topic,
                    isSupervisor: true,
                    gameInfo: {
                        totalPlayers: nonSupervisorPlayers.length,
                        numOutsiders: room.outsiders.length
                    }
                });
            } else {
                // Send regular players only their own role
                const isOutsider = room.outsiders.includes(player.id);
                io.to(player.id).emit('gameStarted', {
                    category,
                    isOutsider,
                    topic: isOutsider ? null : topic,
                    isSupervisor: false
                });
            }
        });
        console.log('Game started in room:', roomCode, 'with', room.outsiders.length, 'outsiders');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        rooms.forEach((room, roomCode) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    if (room.supervisor === socket.id) {
                        room.supervisor = room.players[0].id;
                        room.players[0].isSupervisor = true;
                    }
                    io.to(roomCode).emit('updatePlayers', room.players);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
