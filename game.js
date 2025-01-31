// Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCTi7KH1TN-mc0mxY2IwQPq0R1bklEfMHU",
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
let timer;

// Watch for real-time updates
db.collection("games").doc(gameRoom).onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        players = data.players;
        supervisor = data.supervisor;
        updateUI();
    }
});

// Function to update Firestore
function updateGameData() {
    db.collection("games").doc(gameRoom).set({
        players: players,
        supervisor: supervisor
    });
}

// Player joins game
function joinGame() {
    const playerName = document.getElementById('playerName').value;
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

// Update UI (after Firestore update)
function updateUI() {
    document.getElementById('supervisorSection').style.display = players.length === 4 ? 'block' : 'none';
    document.getElementById('gameArea').style.display = supervisor ? 'block' : 'none';
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

