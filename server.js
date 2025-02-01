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
            outsider: null
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

        // Randomly select outsider from non-supervisor players
        const outsiderIndex = Math.floor(Math.random() * nonSupervisorPlayers.length);
        room.outsider = nonSupervisorPlayers[outsiderIndex].id;

        // Send roles to players
        room.players.forEach(player => {
            if (player.isSupervisor) {
                // Send supervisor all player roles
                io.to(player.id).emit('gameStarted', {
                    category,
                    topic,
                    isSupervisor: true,
                    players: room.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        isOutsider: p.id === room.outsider
                    }))
                });
            } else {
                // Send regular players their own role
                io.to(player.id).emit('gameStarted', {
                    category,
                    isOutsider: player.id === room.outsider,
                    topic: player.id === room.outsider ? null : topic,
                    isSupervisor: false
                });
            }
        });
        console.log('Game started in room:', roomCode);
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
