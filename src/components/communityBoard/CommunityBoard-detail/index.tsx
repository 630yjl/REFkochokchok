"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { useEffect, useState } from "react";
import Comment from "./Comment";

// // ✅ 토큰 가져오기 함수
const getAccessToken = (): string | null => {
  const tokenStorageStr = localStorage.getItem("token-storage");
  if (!tokenStorageStr) return null;
  const tokenData = JSON.parse(tokenStorageStr);
  return tokenData?.accessToken || null;
};

// ✅ API 요청을 위한 Fetch 함수
const fetchCommunityDetail = async (postId: string) => {
  try {
    const token = getAccessToken();
    console.log("🟢 토큰 확인:", token);
    if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");

    if (!token) throw new Error("로그인이 필요합니다.");

    const response = await fetch(`/api/community/${postId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ 게시글 불러오기 실패:", error);
    return null;
  }
};

const CommunityBoardDetail = ({
  params,
}: {
  params: {
    boardId: string;
  };
}) => {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 현재 postId:", params.boardId); // ✅ 현재 boardId 확인

    if (!params.boardId) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🚀 API 호출 실행됨:", params.boardId); // ✅ API 요청 시도 로그

        const postData = await fetchCommunityDetail(params.boardId);

        console.log("🟢 서버 응답 데이터:", postData); // ✅ 서버 응답 확인

        if (!postData) throw new Error("게시글 데이터를 가져오지 못했습니다.");
        setPost(postData);
      } catch (error) {
        console.error("❌ API 요청 실패:", error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [params.boardId]);

  if (loading) {
    return <div className="text-center py-10">⏳ 게시글 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10">❌ {error}</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-10">❌ 게시글을 찾을 수 없습니다.</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 이미지 */}
      <div className="relative w-full h-[23.4375rem]">
        <Swiper
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
          }}
          modules={[Pagination]}
          className="w-full h-full"
          slidesPerView={1}
          spaceBetween={0}
        >
          {post && post.images && post.images.length > 0 ? (
            post.images.map((img: string, index: number) => (
              <SwiperSlide key={index}>
                <div className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={`Slide ${index}`}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))
          ) : (
            // ✅ 이미지가 없을 경우, 회색 배경만 표시 (기본 이미지 없음)
            <SwiperSlide>
              <div className="relative w-full h-full bg-gray-300" />
            </SwiperSlide>
          )}
        </Swiper>
      </div>

      {/* 본문 내용 */}
      <div>
        <div className="flex items-start space-x-3 mt-6 px-3">
          <div
            className="w-12 h-12 rounded-3xl bg-center bg-cover bg-no-repeat flex-shrink-0"
            style={{
              backgroundImage: `url(${post.writeUserProfileImage})`,
              backgroundColor: "#d3d3d3",
            }}
          ></div>
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <div className="text-text-primary font-sm">
                {post.writeUserName}
              </div>
              <div className="flex space-x-1">
                <span className="flex items-center">
                  <Image
                    src="/icons/post_list_view_icon_24px.svg"
                    alt="View count"
                    width={24}
                    height={24}
                  />
                  <span className="text-text-quaternary text-sm ml-1">
                    {post.viewCount}
                  </span>
                </span>
                <span className="flex items-center">
                  <Image
                    src="/icons/community_detail_bookmark_24px.svg"
                    alt="Like count"
                    width={24}
                    height={24}
                  />
                  <span className="text-text-quaternary text-sm ml-1">
                    {post.bookmarkCount}
                  </span>
                </span>
                <span className="flex items-center">
                  <Image
                    src="/icons/post_list_chat_icon_24px.svg"
                    alt="Chat count"
                    width={24}
                    height={24}
                  />
                  <span className="text-text-quaternary text-sm ml-1">
                    {post.commentCount}
                  </span>
                </span>
              </div>
            </div>
            <p className="text-text-tertiary text-sm">{post.createdAt}</p>
          </div>
        </div>
        <h1 className="text-base font-bold text-text-primary mt-6 px-3">
          {post.title}
        </h1>
        <p className="text-sm text-text-primary leading-6 mt-4 mb-4 px-5">
          {post.contents}
        </p>
      </div>

      {/* 댓글 섹션 (우선순위 낮음) */}
      <section>
        <div className="bg-nav-bg p-5">
          <h3 className="text-text-primary text-base mb-3">
            댓글 {post.commentCount}개
          </h3>
        </div>
        {/* 댓글 컴포넌트 */}
        <Comment />
      </section>
    </div>
  );
};

export default CommunityBoardDetail;
