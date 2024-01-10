const { Server } = require("socket.io");
const Room = require("./roomSchema");

const rooms = {};

const generateRoomId = () => {
  return Date.now().toString();
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    connectionStateRecovery: {},
  });

  io.on("connection", (socket) => {
    socket.on("create-room", (username, roomname) => {
      // Checking the input data
      if (!roomname || !username) throw Error("Invalid data provided.");

      // Generating a unique room ID
      const roomId = generateRoomId();

      if (roomId) {
        if (!rooms[roomId]) {
          // Creating a new room object
          const newRoom = {
            roomId: roomId,
            roomname: roomname,
            winner: null,
            currentTurn: socket.id,
            player1: {
              playerId: socket.id,
              name: username,
              score: 0,
              chances: 5,
            },
            player2: null,
          };

          // Validating the new room object against the schema
          const { error, value } = Room.validate(newRoom);

          if (error) {
            console.error(
              "Validation error when creating a room:",
              error.details
            );

            // Handling the error and sending an error message back to the user
            socket.emit("room-creation-error", "Invalid room data.");
          } else {
            // Storing the new room object in our rooms data structure
            rooms[roomId] = newRoom;

            // Joining the socket to the room
            socket.join(roomId);

            // Setting custom properties on the socket to store username and roomId
            socket.roomId = roomId;
            socket.roomname = rooms[roomId].roomname;
            socket.username = username;
            socket.currentTurn = "none";

            console.log(`${username} created a Room: ${roomId}`);
            console.log(rooms[roomId]);

            // Sending a success message back to the user
            socket.emit(
              "room-created",
              socket.roomId,
              socket.roomname,
              socket.username,
              socket.currentTurn
            );
          }
        } else {
          console.log(`Room: ${roomId} already exists.`);

          socket.emit(
            "room-creation-error",
            "Room already exists with the given ID."
          );
        }
      } else {
        console.log("Invalid room ID");

        socket.emit("room-creation-error", "Invalid room ID.");
      }
    });

    socket.on("join-room", (roomId, username) => {
      // Checking the input data
      if (!roomId || !username) throw Error("Invalid data provided.");

      const room = rooms[roomId];

      if (room && room.player2 === null) {
        // Creating a new player object
        const newPlayer = {
          playerId: socket.id,
          name: username,
          score: 0,
          chances: 5,
        };

        // Updating our room with new player data
        room.player2 = newPlayer;

        // Validating the updated game object against the schema
        const { error, value } = Room.validate(room);

        if (error) {
          console.error("Validation error when joining a room:", error.details);

          // Handling the error and sending an error message back to the user
          socket.emit("join-error", "Invalid room data.");

          // Rollbacking the changes
          room.player2 = null;
        } else {
          // Joining the socket to the room
          socket.join(roomId);

          // Setting custom properties on the socket to store username and roomId
          socket.roomId = roomId;
          socket.roomname = rooms[roomId].roomname;
          socket.username = username;
          socket.currentTurn = rooms[roomId].currentTurn;

          // Setting the initial turn to player1.playerId
          rooms[roomId].currentTurn = rooms[roomId].player1.playerId;

          // Notifying both users in the room about the new player
          io.to(roomId).emit(
            "player-joined",
            socket.roomId,
            socket.roomname,
            socket.username,
            socket.currentTurn
          );

          console.log(`${username} joined room: ${roomId}`);
          console.log(rooms[roomId]);
        }
      } else {
        console.log(room ? "Room is full" : "Invalid Room");

        socket.emit("join-error", room ? "Room is full" : "Invalid Room");
      }
    });

    const switchTurn = (roomId) => {
      const room = rooms[roomId];

      // Switching the turn
      room.currentTurn =
        room.currentTurn === room.player1.playerId
          ? room.player2.playerId
          : room.player1.playerId;

      // Notifying both players about switching the turn
      io.to(roomId).emit("switch-turn", room.currentTurn);

      io.to(roomId).emit(
        "turn-info",
        room.currentTurn === room.player1.playerId
          ? room.player1.name
          : room.player2.name
      );
    };

    const determineWinner = (roomId) => {
      const room = rooms[roomId];

      if (room.player1.score > room.player2.score) {
        room.winner = room.player1.name;
        console.log(`Result: ${room.winner} won the game!`);
      } else if (room.player2.score > room.player1.score) {
        room.winner = room.player2.name;
        console.log(`Result: ${room.winner} won the game!`);
      } else {
        room.winner = "It's a tie!";
        console.log(`Result: ${room.winner}`);
      }

      io.to(roomId).emit(
        "game-over",
        room.winner,
        room.player1.score,
        room.player2.score
      );

      delete rooms[roomId];
    };

    socket.on("generate-number", () => {
      const roomId = socket.roomId;
      const room = rooms[roomId];

      const currentPlayer =
        room.player1.playerId === socket.id ? room.player1 : room.player2;

      if (
        currentPlayer &&
        currentPlayer.chances > 0 &&
        room.currentTurn === currentPlayer.playerId
      ) {
        const randomNumber = Math.floor(Math.random() * 10) + 1;
        currentPlayer.score += randomNumber;
        currentPlayer.chances -= 1;

        io.to(roomId).emit(
          "update-score",
          room.player1.playerId,
          room.player1.score,
          room.player2.playerId,
          room.player2.score
        );
        io.to(roomId).emit(
          "chances-remaining",
          currentPlayer.playerId,
          currentPlayer.chances
        );
        io.to(roomId).emit(
          "number-generated",
          currentPlayer.name,
          randomNumber
        );
      }

      if (room.player1.chances === 0 && room.player2.chances === 0) {
        determineWinner(roomId);
      } else {
        switchTurn(roomId);
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.roomId;

      if (rooms[roomId]) {
        const room = rooms[roomId];
        if (room.player1 && room.player1.playerId === socket.id) {
          io.to(roomId).emit("player-disconnected", room.player1.name);
          delete rooms[roomId];
        } else if (room.player2 && room.player2.playerId === socket.id) {
          io.to(roomId).emit("player-disconnected", room.player2.name);
          delete rooms[roomId];
        }
      }
    });
  });
};

module.exports = initializeSocket;
