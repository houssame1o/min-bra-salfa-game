let players = [];
let supervisor = null;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('selectOutsideBtn').addEventListener('click', selectOutsidePlayer);
    document.getElementById('startConversationBtn').addEventListener('click', startConversation);
});

function startGame() {
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('playersSection').style.display = 'block';
}

function joinGame() {
    const playerName = document.getElementById('playerName').value;
    if (playerName) {
        players.push(playerName);
        document.getElementById('playerName').value = '';
        alert(`${playerName} joined the game!`);
        
        if (players.length === 4) {
            document.getElementById('playersSection').style.display = 'none';
            document.getElementById('supervisorSection').style.display = 'block';
            supervisor = players[0]; // The first player to join is the supervisor
            alert(`${supervisor} is the supervisor!`);
        }
    } else {
        alert("Please enter a name");
    }
}

function startConversation() {
    const category = document.getElementById('category').value.trim();
    const subject = document.getElementById('subject').value.trim();

    if (category && subject) {
        alert(`Supervisor ${supervisor} chose the category: ${category} and subject: ${subject}`);
        document.getElementById('supervisorSection').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        // Proceed to the next stage of the game (randomly select outside player)
    } else {
        alert("Please enter both a category and a subject.");
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
