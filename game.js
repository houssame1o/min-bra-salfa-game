// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTi7KH1TN-mc0mxY2IwQPq0R1bklEfMHU",
    authDomain: "minbrasalfa.firebaseapp.com",
    projectId: "minbrasalfa",
    storageBucket: "minbrasalfa.appspot.com",
    messagingSenderId: "303059221332",
    appId: "1:303059221332:web:4b734d5481841cbd6ee6c1",
    measurementId: "G-7R3JQD50RT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentRoom = null;
let players = [];
let roles = {};
let supervisor = null;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
});

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new room and show the lobby
function createRoom() {
    const roomCode = generateRoomCode();
    currentRoom = roomCode;

    db.collection("rooms").doc(roomCode).set({
        players: [],
        supervisor: null
    }).then(() => {
        document.getElementById("roomSelection").classList.add("hidden");
        document.getElementById("lobby").classList.remove("hidden");
        document.getElementById("roomCodeDisplay").innerText = roomCode;

        // 👇 Room creator now listens for real-time updates
        db.collection("rooms").doc(roomCode).onSnapshot((doc) => {
            if (doc.exists) {
                updatePlayerList(doc.data().players, doc.data().supervisor);
            }
        });
    });
}


// Join an existing room and show the lobby
function joinRoom() {
    const roomCode = document.getElementById("roomCodeInput").value.trim().toUpperCase();
    if (!roomCode) {
        alert("يرجى إدخال رمز الغرفة!");
        return;
    }

    currentRoom = roomCode;
    document.getElementById("roomSelection").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("roomCodeDisplay").innerText = roomCode;

    // Listen for updates in real-time
    db.collection("rooms").doc(roomCode).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            updatePlayerList(data.players, data.supervisor);

            // ✅ NEW: If gameStarted is true, show game area to all players
            if (data.gameStarted) {
                document.getElementById("lobby").classList.add("hidden");
                document.getElementById("gameArea").classList.remove("hidden");
                document.getElementById("displayCategory").innerText = data.category;
            }
        }
    });
}




// Join the game and update Firestore
function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert("يرجى إدخال اسمك!");
        return;
    }

    // Save player name in localStorage
    localStorage.setItem("playerName", playerName);

    db.collection("rooms").doc(currentRoom).get().then((doc) => {
        if (!doc.exists) {
            alert("الغرفة غير موجودة!");
            return;
        }

        let roomData = doc.data();
        let players = roomData.players || [];

        if (players.includes(playerName)) {
            alert("هذا الاسم مستخدم بالفعل. اختر اسماً آخر.");
            return;
        }

        players.push(playerName);
        let supervisor = roomData.supervisor || playerName;

        db.collection("rooms").doc(currentRoom).update({
            players: players,
            supervisor: supervisor
        }).then(() => {
            document.getElementById("nameInput").classList.add("hidden");
        });
    });
}



// Update player list with real-time updates
function updatePlayerList(players, supervisor) {
    const playerList = document.getElementById('playerList');
    const playerCount = document.getElementById('playerCount');
    playerList.innerHTML = ""; // Clear previous entries
    playerCount.innerText = players.length; // Update player count

    players.forEach((player) => {
        let row = document.createElement('tr');
        row.innerHTML = player === supervisor
            ? `<td>${player} <span class="badge">👑 المراقب</span></td>`
            : `<td>${player}</td>`;
        playerList.appendChild(row);
    });

    // Ensure `currentPlayer` is defined
    const currentPlayer = localStorage.getItem("playerName");

    // Show "Start Game" button if player is the creator & at least 5 players are in the room
    if (players.length >= 5 && supervisor === currentPlayer) {
        document.getElementById("startGameBtn").classList.remove("hidden");
    } else {
        document.getElementById("startGameBtn").classList.add("hidden");
    }
}


function showCategoryInput() {
    document.getElementById("categoryInput").classList.remove("hidden");
}

function submitGameSetup() {
    const category = document.getElementById('gameCategory').value.trim();
    const secret = document.getElementById('gameSecret').value.trim();
    
    if (!category || !secret) {
        alert("يرجى إدخال الفئة والسالفة!");
        return;
    }

    // Assign roles (1 player "برا السالفة", rest "جوا السالفة")
    let shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    let roles = {};
    roles[shuffledPlayers[0]] = "برا السالفة";
    shuffledPlayers.slice(1).forEach(p => roles[p] = "جوا السالفة");

    // Store game start state in Firestore
    db.collection("rooms").doc(currentRoom).update({
        category: category,
        roles: roles,
        gameStarted: true // ✅ NEW: Marks game as started
    }).then(() => {
        document.getElementById("categoryInput").classList.add("hidden");
        document.getElementById("gameArea").classList.remove("hidden");
        document.getElementById("displayCategory").innerText = category;
        console.log("✅ Game started!");
    });
}


function revealRole() {
    db.collection("rooms").doc(currentRoom).get().then((doc) => {
        if (doc.exists) {
            let data = doc.data();
            let roles = data.roles;
            let currentPlayer = localStorage.getItem("playerName");

            if (roles[currentPlayer]) {
                document.getElementById("playerRole").innerText = `دورك: ${roles[currentPlayer]}`;
            }
        }
    });
}

