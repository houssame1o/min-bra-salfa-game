// Connect to Socket.IO server
const serverUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : window.location.origin;
const socket = io(serverUrl);

// Debug connection
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Failed to connect to server. Please make sure the server is running.');
});

let currentRoom = null;
let playerId = null;
let playerName = null;

document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM loaded');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
        console.log('Create room button listener added');
    } else {
        console.error('Create room button not found');
    }
    
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', joinGame);
        console.log('Join game button listener added');
    } else {
        console.error('Join game button not found');
    }
});

// Create a new room
function createRoom() {
    console.log('Create room clicked');
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    console.log('Emitting createRoom event with name:', playerName);
    socket.emit('createRoom', playerName);
}

// Socket event handlers for room creation
socket.on('roomCreated', ({ roomCode, playerId: pid }) => {
    console.log('Room created:', roomCode);
    currentRoom = roomCode;
    playerId = pid;
    
    document.getElementById("roomSelection").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("roomCodeDisplay").innerText = roomCode;
});

// Join an existing room
function joinGame() {
    console.log('Join game clicked');
    const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
    playerName = document.getElementById('playerName').value.trim();
    
    if (!roomCode || !playerName) {
        alert('Please enter both room code and your name');
        return;
    }

    console.log('Emitting joinRoom event with name:', playerName, 'and room:', roomCode);
    socket.emit('joinRoom', { roomCode, playerName });
}

// Socket event handlers for joining room
socket.on('joinedRoom', ({ roomCode, playerId: pid }) => {
    console.log('Joined room:', roomCode);
    currentRoom = roomCode;
    playerId = pid;
    
    document.getElementById("roomSelection").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("roomCodeDisplay").innerText = roomCode;
});

// Update player list when players join/leave
socket.on('updatePlayers', (players) => {
    console.log('Updating players:', players);
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";
    
    players.forEach(player => {
        const playerElement = document.createElement("div");
        playerElement.className = "player-item";
        playerElement.textContent = `${player.name} ${player.isSupervisor ? '(المراقب)' : ''}`;
        playerList.appendChild(playerElement);
    });

    // Show start game button only for supervisor
    const isSupervisor = players.find(p => p.id === playerId)?.isSupervisor;
    const startGameBtn = document.getElementById("startGameBtn");
    if (isSupervisor && players.length >= 5) {
        startGameBtn.classList.remove("hidden");
        startGameBtn.onclick = showCategoryInput;
        console.log('Showing start game button for supervisor');
    } else {
        startGameBtn.classList.add("hidden");
    }
});

function showCategoryInput() {
    console.log('Showing category input');
    document.getElementById("gameSetup").classList.remove("hidden");
}

function submitGameSetup() {
    console.log('Submitting game setup');
    const category = document.getElementById("categoryInput").value.trim();
    const topic = document.getElementById("topicInput").value.trim();
    
    if (!category || !topic) {
        alert("Please enter both category and topic");
        return;
    }

    console.log('Emitting startGame event with category:', category, 'and topic:', topic);
    socket.emit('startGame', { roomCode: currentRoom, category, topic });
}

// Handle game start
socket.on('gameStarted', ({ category, isOutsider, topic }) => {
    console.log('Game started. Category:', category, 'Is outsider:', isOutsider);
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("gameSetup").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    
    const roleDisplay = document.getElementById("roleDisplay");
    roleDisplay.innerHTML = `
        <h2>Your Role:</h2>
        <p>Category: ${category}</p>
        <p>${isOutsider ? 'You are برا السالفة!' : `Topic: ${topic}`}</p>
        <p class="instructions">${isOutsider ? 'Try to blend in without knowing the topic!' : 'Try to find who is برا السالفة!'}</p>
    `;
});

// Handle errors
socket.on('error', (message) => {
    console.error('Server error:', message);
    alert(message);
});
