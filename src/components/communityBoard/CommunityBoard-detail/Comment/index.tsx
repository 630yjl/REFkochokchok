"use client";

import Input from "@/commons/input";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Comment() {
  const params = useParams<{ boardId: string }>();
  const postId = Number(params?.boardId); // postId를 숫자로 변환
  const [bookmarkToggle, setBookmarkToggle] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0); // ✅ 북마크 개수 상태 추가
  const [inputValue, setInputValue] = useState(""); // 입력 필드 상태

  // ✅ 1️⃣ 초기 북마크 상태 불러오기
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      try {
        const token = localStorage.getItem("token-storage")
          ? JSON.parse(localStorage.getItem("token-storage")!).accessToken
          : null;

        if (!token || !postId) return;

        const response = await fetch(`/api/community/${postId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("북마크 상태 가져오기 실패");

        const data = await response.json();
        console.log("✅ 북마크 상태 불러오기 성공:", data);

        setBookmarkToggle(data.isBookmarked); // ✅ 초기 북마크 상태 설정
        setBookmarkCount(data.bookmarkCount); // ✅ 북마크 개수 설정
      } catch (error) {
        console.error("❌ 북마크 상태 가져오기 실패:", error);
      }
    };

    fetchBookmarkStatus();
  }, [bookmarkToggle]); // ✅ postId가 변경될 때만 실행

  const toggleBookmark = async (postId: number) => {
    if (!postId) return; // ✅ postId가 없으면 실행하지 않음
    try {
      const token = localStorage.getItem("token-storage")
        ? JSON.parse(localStorage.getItem("token-storage")!).accessToken
        : null;

      if (!token || !postId) return;

      const response = await fetch(`/api/community/${postId}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`북마크 토글 실패: ${response.status}`);

      console.log("✅ 북마크 토글 성공");
      setBookmarkToggle((prev) => !prev);
      setBookmarkCount((prev) => (bookmarkToggle ? prev - 1 : prev + 1)); // ✅ 즉시 카운트 업데이트
    } catch (error) {
      console.error("❌ 북마크 토글 실패:", error);
      alert("북마크 변경에 실패했습니다.");
    }
  };

  return (
    <>
      <section>
        {/* 하단 입력 & 북마크 버튼 */}
        <div className="w-full bg-[#FDFCF8]">
          {/* 만든거 */}
          {/* 댓글 리스트 */}
          <div className="space-y-6 px-5">
            <span>{bookmarkCount}</span>
            {/* 개별 댓글 */}
            <div>
              <div className="flex items-start space-x-3">
                {/* 프로필 이미지 */}
                <div className="w-12 h-12 rounded-3xl bg-center bg-cover bg-no-repeat bg-[#d3d3d3] flex-shrink-0"></div>
                {/* 댓글 내용 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">홍길동</span>
                    <span className="text-gray-500 text-sm">1주 전</span>
                  </div>
                  <p className="text-gray-700">
                    저도 여기 가보고 싶네요! 위치가 어디인가요?
                  </p>
                  <button className="text-sm text-green-600 mt-1 hover:underline">
                    답글 달기
                  </button>
                </div>
              </div>

              {/* 대댓글 (답글) */}
              <div className="ml-10 mt-3 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-3xl bg-center bg-cover bg-no-repeat bg-[#d3d3d3] flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">홍길동2</span>
                      <span className="text-gray-500 text-sm">1주 전</span>
                    </div>
                    <p className="text-gray-700">
                      강남역 3번 출구에서 도보 5분 거리예요! 구체적인 위치는
                      DM으로 보내드릴게요
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 만든거 */}
          <footer className="flex w-full items-end">
            <div className="mx-0 flex justify-between p-4 items-center gap-2 w-full">
              <div
                className="min-w-[3rem] h-full"
                onClick={() => toggleBookmark(postId)}
              >
                <Image
                  src={
                    bookmarkToggle
                      ? "/images/community_detailPage_unBookmark_44px.svg"
                      : "/images/community_detailPage_bookmark_44px.svg"
                  }
                  alt="Bookmark Icon"
                  width={44}
                  height={44}
                />
              </div>
              <div className="w-full">
                <Input
                  className="w-full max-h-[3rem] flex items-center gap-2 rounded-[5rem] border border-[#BBB8AB] bg-[#F4F3F1] text-base font-medium leading-[1.5rem] tracking-[-0.025rem]"
                  placeholder="메세지를 입력해주세요."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div className="min-w-[3rem] h-full">
                <Image
                  src="/images/chat_send_btn_img_44px.svg"
                  alt="Send Icon"
                  width={44}
                  height={44}
                />
              </div>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
