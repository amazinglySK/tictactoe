require("dotenv").config();

const PORT = process.env.PORT;

const io = require("socket.io")(PORT, {
  // TODO : change the origin to localhost:5500 for dev purposes
  cors: {
    origin: "*",
  },
});

console.log("Server has started");

var roomData = {};

io.on("connection", (socket) => {
  console.log(`A new user joined at ${socket.id}`);
  // Makes a random codde for a game
  function makeid(length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  // Checks if the room is ok to join
  function checkRoomAndCode(code) {
    let rooms = Object.fromEntries(io.sockets.adapter.rooms);
    if (rooms[code] != undefined) {
      if (rooms[code].size < 2) return true;
      else {
        return false;
      }
    } else {
      return false;
    }
  }

  // Create Logic
  socket.on("create_game", (nick) => {
    let code = makeid(6);
    socket.join(code);
    roomData[code] = [nick];
    socket.emit("game_created", code);
  });

  // Initialisation
  let movemap = new Array(3);
  for (i = 0; i < movemap.length; i++) {
    movemap[i] = new Array(3);
  }

  function resetMap() {
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        movemap[i][j] = 0;
      }
    }
  }

  resetMap();
  // Join logic

  socket.on("join_game", (code, nick) => {
    if (checkRoomAndCode(code)) {
      socket.join(code);
      roomData[code].push(nick);
      let sockets = Array.from(
        Object.fromEntries(io.sockets.adapter.rooms)[code]
      );
      let starterSocket = sockets[Math.floor(Math.random() * sockets.length)];
      io.in(code).emit("start", code, starterSocket, roomData[code]);
      resetMap();
    } else {
      socket.emit("attempt_fail", code);
    }
  });

  // modifies the 2d array <movemap> according to the className in each event
  function convertClassToMap(className) {
    if (className == "top-left") movemap[0][0] = 1;
    else if (className == "top") movemap[0][1] = 1;
    else if (className == "top-right") movemap[0][2] = 1;
    else if (className == "left") movemap[1][0] = 1;
    else if (className == "center") movemap[1][1] = 1;
    else if (className == "right") movemap[1][2] = 1;
    else if (className == "bottom-left") movemap[2][0] = 1;
    else if (className == "bottom") movemap[2][1] = 1;
    else if (className == "bottom-right") movemap[2][2] = 1;
    else console.log("Something completel unexpected happened.. :(");
  }

  // checking for winning conditions
  function checkWin() {
    // checking diagonals first
    if (
      movemap[0][0] == movemap[1][1] &&
      movemap[0][0] == movemap[2][2] &&
      movemap[0][0] != 0
    )
      return true;
    else if (
      movemap[0][2] == movemap[1][1] &&
      movemap[0][2] == movemap[2][0] &&
      movemap[0][2] != 0
    )
      return true;
    // going to other cases
    else {
      for (i = 0; i < 3; i++) {
        // checking horizontals
        if (
          movemap[i][0] == movemap[i][1] &&
          movemap[i][0] == movemap[i][2] &&
          movemap[i][0] != 0
        )
          return true;
        // checking verticals
        else if (
          movemap[0][i] == movemap[1][i] &&
          movemap[0][i] == movemap[2][i] &&
          movemap[0][i] != 0
        )
          return true;
        // checking if the loop has reached its end
        else if (i == 3) return false;
        else continue;
      }
    }
  }
  socket.on("send_move", (move, code) => {
    var newMove = move.split(" ")[1];
    convertClassToMap(newMove);
    socket.to(code).emit("receive_move", newMove);
    // special condition <win>
    if (checkWin()) {
      socket.emit("win");
      socket.to(code).emit("lose");
    }
  });

  socket.on("draw", (code) => {
    io.in(code).emit("drawGame", code);
  });

  socket.on("replay", (code) => {
    resetMap();
    socket.to(code).emit("replay_request", code);
  });

  socket.on("accept", (code) => {
    resetMap();
    let sockets = Array.from(
      Object.fromEntries(io.sockets.adapter.rooms)[code]
    );
    let starterSocket = sockets[Math.floor(Math.random() * sockets.length)];
    io.in(code).emit("replay_start", code, starterSocket);
  });

  socket.on("deny", (code) => {
    resetMap();
    io.in(code).emit("end_game", code);
    io.socketsLeave(code);
    delete roomData[code];
  });
  function removeDeadRooms() {
    let room_array = [...io.sockets.adapter.rooms.keys()];
    for (const property in roomData) {
      if (!room_array.includes(property)) {
        delete roomData[property];
      }
    }
  }

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    removeDeadRooms();
  });
});
