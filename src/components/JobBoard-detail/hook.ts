/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { BoardData, CheckLike } from "./types";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import axios from "axios";
// useRouter, axiosInstance 추가함.

const useJobBoardDetail = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [checkLike, setCheckLike] = useState(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const router = useRouter(); // ✅ 수정됨

  // 엑세스 토큰 가져옴
  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  // ✅ 현재 로그인한 사용자 ID 가져오기 (추가)
  const getUserId = (): number | null => {
    const userStorageStr = localStorage.getItem("user-storage");
    if (!userStorageStr) return null; // ❌ 데이터가 없을 경우 null 반환

    try {
      const userStorageData = JSON.parse(userStorageStr);
      return userStorageData?.state?.user?.id || null; // ✅ user ID 가져오기
    } catch (error) {
      console.error("❌ 유저 ID 파싱 실패:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchPostData = async () => {
      const token = getAccessToken();
      const loggedInUserId = getUserId(); // ✅ 로그인한 사용자 ID 가져오기
      if (!token) throw new Error("로그인이 필요합니다.");
      if (!boardId) return;
      try {
        // 게시글 정보 가져옴
        const response = await fetch(`/api/trade/${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        setBoardData(result);

        // 내가 좋아요한 게시글인지 확인
        const checkLikeResponse = await fetch(`/api/users/trade-posts/liked`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const checkLikeResult = await checkLikeResponse.json();
        setCheckLike(checkLikeResult);

        // 좋아요 상태
        const isAlreadyLiked = checkLikeResult.some(
          (item: CheckLike) => item.id === parseInt(boardId, 10)
        );
        setIsLiked(isAlreadyLiked);
        console.log("📌 현재 로그인한 사용자 ID:", loggedInUserId);
        console.log("📌 게시글 작성자 ID:", result.writeUserId); // ✅ 작성자 정보 로그 확인
        console.log("PostId:", boardId);
      } catch (error) {
        console.error("❌ 게시글 불러오기 실패:", error);
        alert("게시글 불러오기에 실패했습니다.");
      }
    };
    fetchPostData();
  }, [boardId]);

  const likeButtonClickHandler = async () => {
    const token = getAccessToken();
    try {
      const response = await fetch(`/api/trade/${boardId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsLiked((prevState) => !prevState);
      } else {
        alert("좋아요를 처리하는데 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // ------------------------------ 찬우가 함
  // ✅ 채팅방 생성 함수 추가 (새로 추가됨)
  const handleChat = async () => {
    const buyerId = getUserId();
    const sellerId = boardData?.writeUserId;
    const postId = boardId;
    const token = getAccessToken(); // ✅ 수정된 함수로 토큰 가져오기

    console.log("🛠️ buyerId:", buyerId);
    console.log("🛠️ sellerId:", sellerId);
    console.log("🛠️ postId:", postId);
    console.log("🛠️ token:", token); // ✅ 콘솔에서 토큰 정상 출력되는지 확인

    if (!buyerId || !sellerId || !postId || !token) {
      alert("유효한 요청이 아닙니다.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/trade/${postId}/chat-rooms`,
        {
          title: "거래 채팅방",
          tradePostId: postId,
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // ✅ 토큰 추가
        }
      );

      if (response.status === 200) {
        const chatRoomId = response.data;
        console.log(`✅ 생성된 채팅방 ID: ${chatRoomId}`);
        router.push(`/chatList/chatRoom?roomId=${chatRoomId}`);
      } else {
        console.error("❌ 채팅방 생성 실패:", response.data.message);
        alert("채팅방을 생성할 수 없습니다.");
      }
    } catch (error) {
      console.error("🚨 API 오류:", error);
      alert("채팅방 생성 중 오류가 발생했습니다.");
    }
  };

  // ------------------------------

  return {
    likeButtonClickHandler,
    boardData,
    isLiked,
    handleChat,
  };
};

export default useJobBoardDetail;
