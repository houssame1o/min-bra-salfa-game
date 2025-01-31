// Firebase Configuration
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "minbrasalfa.firebaseapp.com",
    projectId: "minbrasalfa",
    storageBucket: "minbrasalfa.firebasestorage.app",
    messagingSenderId: "303059221332",
    appId: "1:303059221332:web:4b734d5481841cbd6ee6c1",
    measurementId: "G-7R3JQD50RT"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let players = [];
let supervisor = null;
let gameRoom = "room1";  // Static room (Later, make it dynamic)
let scores = {};
let timer;

// Real-time updates
db.collection("games").doc(gameRoom).onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        players = data.players;
        supervisor = data.supervisor;
        updateUI();
    }
});

function updateGameData() {
    db.collection("games").doc(gameRoom).set({
        players: players,
        supervisor: supervisor
    });
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded!");  // Debugging Log

    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    } else {
        console.error("Start Game button not found!");
    }

    const joinGameBtn = document.getElementById('joinGameBtn');
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', joinGame);
    } else {
        console.error("Join Game button not found!");
    }

    const startConversationBtn = document.getElementById('startConversationBtn');
    if (startConversationBtn) {
        startConversationBtn.addEventListener('click', startConversation);
    } else {
        console.error("Start Conversation button not found!");
    }

    const selectOutsideBtn = document.getElementById('selectOutsideBtn');
    if (selectOutsideBtn) {
        selectOutsideBtn.addEventListener('click', selectOutsidePlayer);
    } else {
        console.error("Select Outside button not found!");
    }
});

function startGame() {
    console.log("Start Game Clicked!");  // Debugging Log
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('playersSection').style.display = 'block';
}

function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (playerName) {
        players.push(playerName);
        document.getElementById('playerName').value = '';
        if (players.length === 4) {
            supervisor = players[0];
        }
        updateGameData();
    } else {
        alert("Enter a name!");
    }
}

function startConversation() {
    const category = document.getElementById('category').value.trim();
    const subject = document.getElementById('subject').value.trim();

    if (category && subject) {
        alert(`Supervisor ${supervisor} chose: ${category} - ${subject}`);
        document.getElementById('supervisorSection').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';

        // Start countdown timer (3 minutes)
        let timeLeft = 180;
        document.getElementById('timer').innerHTML = `Time left: ${timeLeft}s`;

        timer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer').innerHTML = `Time left: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert("Time's up!");
            }
        }, 1000);
    } else {
        alert("Enter both category and subject.");
    }
}

function selectOutsidePlayer() {
    if (players.length < 4) {
        alert("Need at least four players to start");
        return;
    }
    const randomIndex = Math.floor(Math.random() * players.length);
    const outsidePlayer = players[randomIndex];
    document.getElementById('selectedPlayer').innerHTML = `<h3>The outside player is: ${outsidePlayer}</h3>`;
}

// Score System
function submitGuess() {
    const playerName = prompt("Enter your name:");
    const guess = document.getElementById('guessInput').value.trim();

    if (!playerName || !guess) {
        alert("Enter both name and guess.");
        return;
    }

    const correctSubject = document.getElementById('subject').value.trim().toLowerCase();
    if (guess.toLowerCase() === correctSubject) {
        scores[playerName] = (scores[playerName] || 0) + 1;
        alert(`${playerName} guessed correctly! +1 point`);
    } else {
        alert("Wrong guess!");
    }
    updateScores();
}

function updateScores() {
    let scoreBoard = document.getElementById('scoreBoard');
    scoreBoard.innerHTML = "<h3>Scoreboard</h3>";
    for (let player in scores) {
        scoreBoard.innerHTML += `<p>${player}: ${scores[player]} points</p>`;
    }
}

// Update UI when Firestore data changes
function updateUI() {
    document.getElementById('supervisorSection').style.display = players.length === 4 ? 'block' : 'none';
    document.getElementById('gameArea').style.display = supervisor ? 'block' : 'none';
}


