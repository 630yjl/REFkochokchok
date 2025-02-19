/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Button from "@/commons/Button";
// import KakaoMapComponent from "@/commons/kakaoMap-socket";
import KakaoMapComponent from "@/commons/kakakoMap";
import { useUserStore } from "@/commons/store/userStore";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

const WalkMap = () => {
  const [time, setTime] = useState<number>(0); // 타이머 초기값: 0초 (UI용)
  const [isWalking, setIsWalking] = useState<boolean>(false); // 산책 상태 관리
  const [hasEnded, setHasEnded] = useState<boolean>(false); // 산책 종료 여부 (종료 후 재시작 불가)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { boardId } = useParams() as { boardId: string };
  const [boardData, setBoardData] = useState<{ writeUserId: number } | null>(
    null
  );

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

  // 타이머 시작 및 정지 핸들러
  const toggleWalking = () => {
    // 산책 종료 후에는 재시작 불가
    if (hasEnded) return;
    if (isWalking) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsWalking(false);
      setHasEnded(true);
    } else {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      setIsWalking(true);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* 지도 컨테이너 */}
      <div className="relative w-full h-[calc(100%-150px)]">
        {/* isWalking와 hasEnded 상태를 KakaoMapComponent에 전달 */}
        <KakaoMapComponent
          isWalking={isWalking}
          boardId={boardId}
          hasEnded={hasEnded}
        />
      </div>

      {/* 하단 패널 */}
      <div className="z-10 px-5 pt-5 pb-20 fixed bottom-0 w-full bg-white text-center flex flex-col items-center gap-3 bg-gray-15 rounded-t-[2rem] shadow-[0_-4px_50px_rgba(0,0,0,0.35)]">
        <Button
          design="design1"
          width="full"
          className="flex justify-center items-center gap-1 p-5 self-stretch h-14 text-base-bold"
          onClick={
            boardData &&
            useUserStore.getState().user?.id === boardData.writeUserId
              ? undefined
              : toggleWalking
          }
          disabled={
            (boardData &&
              useUserStore.getState().user?.id === boardData.writeUserId) ||
            hasEnded
          }
        >
          {boardData &&
          useUserStore.getState().user?.id === boardData.writeUserId
            ? "산책 중입니다"
            : hasEnded
            ? "산책 종료됨"
            : isWalking
            ? "산책 종료하기"
            : "산책 시작하기"}
        </Button>
      </div>
    </div>
  );
};

export default WalkMap;
