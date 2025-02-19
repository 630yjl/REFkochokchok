// 1 - 소켓 서버를 생성함
import { Server } from "socket.io";
import http from "http";

const httpServer = http.createServer();

// 5001 포트에서 0.0.0.0(모든 인터페이스)로 바인딩
httpServer.listen(5001, "0.0.0.0", () => {
  console.log("HTTP 서버가 5001 포트에서 실행 중입니다.");
});

// 2 - 5000포트를 가진 소켓 서버를 만든다, CORS를 추가해서 허락된 브라우저("http://localhost:3000")만 접근하도록 함.
const io = new Server(httpServer, {
  cors: {
    origin: "*", // *은 일시적으로 모든 도메인 허용하는 것
  },
});

// 3 - 소켓 서버에서 새로운 클라가 연결되었을때 실행되는 이벤트
io.sockets.on("connection", (socket) => {
  console.log("서버: 클라이언트 연결 성공");

  // boardId로 room 구분 (위치 및 타이머 동기화를 위한 room)
  const boardId = socket.handshake.query.boardId;
  if (boardId) {
    socket.join(boardId);
    console.log(`Socket ${socket.id}가 room ${boardId}에 참가`);
  }

  // 4 - 이벤트가 message로 부터 오는 정보를 받는다
  socket.on("message", (message) => {
    // 5 - emit는 서버에서 모두 연결된 클라로 데이터 전송할때 사용! => 메세지 나 포함 모두에게 전송
    socket.broadcast.emit("message", message);
    console.log(message);
  });

  // 위치 업데이트 처리 (추가된 부분)
  socket.on("locationUpdate", (location) => {
    if (boardId) {
      // 같은 boardId를 가진 사용자들에게만 위치 정보 전송
      socket.to(boardId).emit("locationUpdate", location);
      console.log(`위치 업데이트 (board ${boardId}):`, location);
    }
  });

  // socket.on("login", (data) => {
  //   // 로그인 정보 모두에게 전달해서 새 사용자가 로그인했음을 알린다.
  //   socket.broadcast.emit("sLogin", data);
  // });

  // 타이머 업데이트 처리
  socket.on("timerUpdate", (data) => {
    if (boardId) {
      // 해당 room의 다른 클라이언트에 타이머 상태 전달
      socket.to(boardId).emit("timerUpdate", data);
      console.log(`타이머 업데이트 (board ${boardId}):`, data);

      // 산책 종료 시(room의 모든 클라이언트 강제 연결 해제)
      if (data.hasEnded) {
        io.in(boardId).disconnectSockets();
        console.log(
          `Board ${boardId}의 클라이언트들이 산책 종료로 인해 연결 해제됨.`
        );
      }
    }
  });

  // 6 - 연결이 끊긴다면 실행되는 이벤트
  socket.on("disconnect", () => {
    console.log("서버: 클라이언트 연결 끊김");
    if (boardId) {
      socket.leave(boardId);
      console.log(`Socket ${socket.id}가 room ${boardId}에서 퇴장`);
    }
  });
});
