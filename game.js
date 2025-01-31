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

let gameRoom = "room1";  // Static room for now
let players = [];

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('startConversationBtn').addEventListener('click', startConversation);
    document.getElementById('selectOutsideBtn').addEventListener('click', selectOutsidePlayer);

    // Listen for real-time updates on player list
    db.collection("games").doc(gameRoom).onSnapshot((doc) => {
        if (doc.exists) {
            players = doc.data().players;
            updatePlayerList();
        }
    });
});

// Function to allow a player to join the game
function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert("Please enter your name!");
        return;
    }

    if (players.includes(playerName)) {
        alert("This name is already taken. Choose another one.");
        return;
    }

    players.push(playerName);

    // Update Firestore with new player
    db.collection("games").doc(gameRoom).set({ players });

    document.getElementById('playerName').value = '';
}

// Function to update the player table in real-time
function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = "";  // Clear old list

    players.forEach((player) => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${player}</td>`;
        playerList.appendChild(row);
    });
}

function startGame() {
    console.log("Start Game Clicked!");
    document.getElementById('playersSection').style.display = 'block';
}

function startConversation() {
    const category = document.getElementById('category').value.trim();
    const subject = document.getElementById('subject').value.trim();

    if (category && subject) {
        alert(`Supervisor chose: ${category} - ${subject}`);
        document.getElementById('supervisorSection').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';

        let timeLeft = 180;
        document.getElementById('timer').innerHTML = `Time left: ${timeLeft}s`;

        let timer = setInterval(() => {
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
        alert(`${playerName} guessed correctly!`);
    } else {
        alert("Wrong guess!");
    }
}

