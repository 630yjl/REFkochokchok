"use client";
import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Button from "@/commons/Button";
import { useUserStore } from "@/commons/store/userStore";
import { useParams } from "next/navigation";
import KakaoMapComponent from "@/commons/kakaoMap-socket";

const WalkMap: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerSocketRef = useRef<Socket | null>(null);
  const { boardId } = useParams() as { boardId: string };
  const [boardData, setBoardData] = useState<{ writeUserId: number } | null>(
    null
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // 게시물 데이터 조회
  useEffect(() => {
    if (!boardId) return;
    const token = localStorage.getItem("token-storage")
      ? JSON.parse(localStorage.getItem("token-storage")!)
      : null;
    const fetchBoardData = async () => {
      try {
        const response = await fetch(`/api/trade/${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setBoardData(data);
      } catch (error) {
        console.error("[DEBUG] Error fetching board data:", error);
      }
    };
    fetchBoardData();
  }, [boardId]);

  // 타이머 및 소켓 연결 (타이머 상태 공유)
  useEffect(() => {
    if (!boardId) return;
    const socket = io(process.env.NEXT_PUBLIC_SERVER, {
      query: { boardId },
      transports: ["websocket"],
    });
    timerSocketRef.current = socket;
    socket.on(
      "timerUpdate",
      (data: { isWalking: boolean; time: number; hasEnded: boolean }) => {
        setIsWalking(data.isWalking);
        setTime(data.time);
        setHasEnded(data.hasEnded);
      }
    );
    socket.on("disconnect", () => {
      console.log("서버로부터 연결 해제됨");
    });
    return () => {
      socket.disconnect();
    };
  }, [boardId]);

  // 산책 시작/정지 핸들러
  const toggleWalking = () => {
    if (hasEnded) return;
    if (isWalking) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsWalking(false);
      setHasEnded(true);
      timerSocketRef.current?.emit("timerUpdate", {
        isWalking: false,
        time,
        hasEnded: true,
      });
    } else {
      const startTime = Date.now();
      setIsWalking(true);
      setHasEnded(false);
      setTime(0);
      timerSocketRef.current?.emit("timerUpdate", {
        isWalking: true,
        time: 0,
        hasEnded: false,
      });
      timerRef.current = setInterval(() => {
        const newTime = Math.floor((Date.now() - startTime) / 1000);
        setTime(newTime);
        timerSocketRef.current?.emit("timerUpdate", {
          isWalking: true,
          time: newTime,
          hasEnded: false,
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isPostAuthor =
    boardData && useUserStore.getState().user?.id === boardData.writeUserId;

  return (
    <div className="overflow-hidden">
      {/* 맵 컨테이너 */}
      <div className="w-full h-[calc(100vh-200px)]">
        <KakaoMapComponent
          boardId={boardId}
          walkEnded={hasEnded}
          isWalking={isWalking}
        />
      </div>
      {/* 하단 패널 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-5 pt-5 pb-20 bg-white text-center flex flex-col items-center gap-3 bg-gray-15 rounded-t-[2rem] shadow-[0_-4px_50px_rgba(0,0,0,0.35)]">
        <div className="text-[3rem] font-bold">{formatTime(time)}</div>
        <Button
          design="design1"
          width="full"
          className="flex justify-center items-center gap-1 p-5 self-stretch h-14 text-base-bold"
          onClick={!isPostAuthor ? toggleWalking : undefined}
          disabled={isPostAuthor || hasEnded}
        >
          {hasEnded
            ? "산책 종료됨"
            : isPostAuthor
            ? "산책 중입니다"
            : isWalking
            ? "산책 종료하기"
            : "산책 시작하기"}
        </Button>
      </div>
    </div>
  );
};

export default WalkMap;
