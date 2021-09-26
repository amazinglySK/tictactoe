const socket = io("https://tictactoeio-server.herokuapp.com"); // Note : You won't be able to connect to this server. Change the above link to https://localhost:3000 to run the app properly.

socket.on("connect_error", () => {
  window.location.href = "/error";
});
$(document).ready(() => {
  var index = 0;
  function checkDraw() {
    let classes = [
      ".top-left",
      ".top",
      ".top-right",
      ".left",
      ".center",
      ".right",
      ".bottom-left",
      ".bottom",
      ".bottom-right",
    ];
    counter = 0;
    for (i = 0; i <= classes.length; i++) {
      if (String($(classes[i]).text()) != "") {
        counter++;
      }
    }
    if (counter == 9) {
      return true;
    } else {
      return false;
    }
  }
  // Joiing them into a room
  $(".loseScreen").hide();
  $(".winScreen").hide();
  $(".accept-btn").hide();
  $(".deny-btn").hide();

  $(".join-btn").click((e) => {
    let nickname = $("#nickname").val();
    let code = $("#room-code").val();
    if (code == "" || code == " " || code == undefined || code == null) {
      alert("Please enter a code");
    } else if (nickname == "" || nickname == " ") {
      alert("Please enter a nickname!!");
    } else {
      socket.emit("join_game", code, nickname);
    }
  });

  $(".create-game-btn").click((e) => {
    index++;
    let nickname = $("#nickname").val();
    if (nickname != "" && nickname != " ") socket.emit("create_game", nickname);
    else alert("Please enter your nickname");
  });

  $(".tile").click((e) => {
    if ($(e.target).text() == "") {
      $(e.target).text("X");
      $(".moveScreen").show();
      let move = $(e.target).attr("class");
      socket.emit("send_move", move, localStorage.getItem("currentGameCode"));
    } else {
      alert("The tile is alread filled");
    }
  });

  $(".replay-btn").click((e) => {
    socket.emit("replay", localStorage.getItem("currentGameCode"));
    $(".response-text").text("Request sent");
  });

  socket.on("attempt_fail", () => {
    alert(
      "Some error occured. Please see to it that you are not trying to join a room which is already occupied. Also please check your code.Thank you"
    );
  });

  socket.on("game_created", (code) => {
    $(".joinScreen").hide();
    $("#code").text(`Send this code to your friend : ${code}`);

    $("#copy").click(async (e) => {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          alert("The code is copied to clipboard");
        })
        .catch((err) => {
          alert("Some error occured.. Please contact @amazinglySK");
        });
    });
  });

  socket.on("start", (code, starter, opponents) => {
    if (starter === socket.id) {
      $(".moveScreen").hide();
    }

    $(".opponentName").text(`Your opponent is : ${opponents[index]}`);
    $(".endScreen").hide();
    $(".joinScreen").hide();
    $(".waitScreen").hide();
    localStorage.setItem("currentGameCode", code);
  });

  socket.on("receive_move", (move) => {
    $(".moveScreen").hide();
    console.log(move);
    $(`.${move}`).text("O");
    if (checkDraw() === true) {
      console.log("Draw");
      socket.emit("draw", localStorage.getItem("currentGameCode"));
    }
  });

  socket.on("win", () => {
    $(".endScreen").show();
    $(".match-status").text("You won!!");
    $(".replay-btn").show();
  });

  socket.on("lose", () => {
    $(".endScreen").show();
    $(".match-status").text("Uh oh.. You lost");
    $(".replay-btn").show();
  });

  socket.on("drawGame", (code) => {
    $(".endScreen").show();
    $(".match-status").text("It's a draw!!");
    $(".replay-btn").show();
  });

  socket.on("replay_request", (code) => {
    $(".replay-btn").hide();
    $(".accept-btn").show();
    $(".deny-btn").show();

    $(".deny-btn").click((e) => {
      socket.emit("deny", code);
    });

    $(".accept-btn").click((e) => {
      socket.emit("accept", code);
    });
  });

  socket.on("replay_start", (code, starter) => {
    if (starter == socket.id) {
      $(".moveScreen").hide();
    } else {
      $(".moveScreen").show();
    }
    $(".endScreen").hide();
    $(".response-text").text("");
    $(".accept-btn").hide();
    $(".deny-btn").hide();
    $(".tile").text("");
  });

  socket.on("end_game", (code) => {
    index = 0;
    $(".endScreen").hide();
    $(".joinScreen").show();
    $(".waitScreen").show();
    $(".accept-btn").hide();
    $(".deny-btn").hide();
    $(".tile").text("");
    $(".opponentName").text("");
  });
});

/* 
TODO :  Add link sharing support (Probably with express)
        Check for blank responses
        Add p tag with instruction as to refresh
        Handle empty rooms
*/
