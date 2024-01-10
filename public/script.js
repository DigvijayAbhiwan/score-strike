const socket = io();

// Variables
const roomnameHeading = document.getElementById("roomname");
const mainContainer = document.getElementById("main-container");
const createRoomDiv = document.getElementById("create-room");
const roomnameInput = document.getElementById("room-name-input");
const usernameCreateInput = document.getElementById("username-create");
const createRoomButton = document.getElementById("create-room-btn");
const joinRoomDiv = document.getElementById("join-room");
const roomIdInput = document.getElementById("room-id");
const usernameJoinInput = document.getElementById("username-join");
const joinRoomButton = document.getElementById("join-room-btn");
const gameContainer = document.getElementById("game-container");
const turnInfoPara = document.getElementById("turn-info");
const generateNumberButton = document.getElementById("generate-number-btn");
const yourScore = document.getElementById("your-score");
const remainingChance = document.getElementById("chances-remaining");
const opponentScore = document.getElementById("opponent-score");
const gameResult = document.getElementById("game-result");

// Handler functions
gameResult.innerText = "Yet to be decide!";
turnInfoPara.innerText = "";
yourScore.innerText = 0;
remainingChance.innerText = 5;
opponentScore.innerText = 0;

const resetUI = () => {
  createRoomDiv.classList.remove("hidden");
  joinRoomDiv.classList.remove("hidden");
  gameContainer.classList.add("hidden");
};

const switchToGameModeHandler = (currentTurn) => {
  createRoomDiv.classList.add("hidden");
  joinRoomDiv.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  if (currentTurn === socket.id) {
    generateNumberButton.disabled = false;
  }
};

const createRoomHandler = () => {
  const username = usernameCreateInput.value;
  const roomname = roomnameInput.value;
  socket.emit("create-room", username, roomname);
  alert(`${username} created room ${roomname}`);
};

const joinRoomHandler = () => {
  const roomId = roomIdInput.value;
  const username = usernameJoinInput.value;
  socket.emit("join-room", roomId, username);
};

const numberGeneratorHandler = () => {
  socket.emit("generate-number");
};

const disconnectPlayerHandler = (opponent) => {
  alert(`${opponent} has left the game. You win!`);
  resetUI();
};

const playerDisconnectedHandler = (opponent) => {
  alert(`${opponent} has left the game. You win!`);
  resetUI();
};

// Listening Events
socket.on("room-created", (roomId, roomname, username, currentTurn) => {
  roomnameHeading.textContent = `Your are in: ${roomname} and room ID is: ${roomId}`;
  switchToGameModeHandler(currentTurn);
});

socket.on("player-joined", (roomId, roomname, username, currentTurn) => {
  roomnameHeading.textContent = `Your are in: ${roomname} and room ID is: ${roomId}`;
  alert(`${username} joined room: ${roomname} with room id: ${roomId}`);
  console.log(`${username} joined room: ${roomname} with room id: ${roomId}`);
  switchToGameModeHandler(currentTurn);
});

socket.on("switch-turn", (currentTurn) => {
  if (socket.id === currentTurn) {
    generateNumberButton.disabled = false;
  } else {
    generateNumberButton.disabled = true;
  }
});

socket.on("turn-info", (currenPlayer) => {
  turnInfoPara.innerHTML = currenPlayer;
  console.log(currenPlayer);
});

socket.on("game-over", (winner, player1Score, player2Score) => {
  gameResult.innerText = `${winner} won!`;
  alert(`${winner} won!`);
  resetUI();
});

socket.on(
  "update-score",
  (player1Id, player1Score, player2Id, player2Score) => {
    if (socket.id === player1Id) {
      yourScore.innerText = player1Score;
      opponentScore.innerText = player2Score;
    } else if (socket.id === player2Id) {
      yourScore.innerText = player2Score;
      opponentScore.innerText = player1Score;
    }
  }
);

socket.on("chances-remaining", (currentPlayerId, currenPlayerChances) => {
  if (socket.id === currentPlayerId) {
    remainingChance.innerText = currenPlayerChances;
  }
});

socket.on("number-generated", (currentPlayerName, randomNumber) => {
  alert(`${currentPlayerName} generated ${randomNumber}`);
});

socket.on("player-disconnected", playerDisconnectedHandler);

socket.on("room-creation-error", (error) => {
  alert(error);
  console.log(error);
});

socket.on("join-error", (error) => {
  alert(error);
  console.log(error);
});

// Executing handlers on the event listeners
createRoomButton.addEventListener("click", createRoomHandler);
joinRoomButton.addEventListener("click", joinRoomHandler);
generateNumberButton.addEventListener("click", numberGeneratorHandler);
