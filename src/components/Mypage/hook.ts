// src/components/Mypage/hook.ts

/**
 * 마이페이지 커스텀 훅
 *
 * ✨ 수정사항 (2024.02.12):
 * 1. API 연동을 통한 데이터 관리
 *   - 거래/커뮤니티/후기 게시글 실시간 동기화
 *   - 조회수, 북마크, 댓글 수 자동 반영
 *
 * 2. 데이터 리프레시 기능
 *   - 페이지 진입/이탈 시 데이터 갱신
 *   - 상호작용 발생 시 자동 갱신
 *
 * 3. 데이터 처리 최적화
 *   - Promise.all을 통한 병렬 로딩
 *   - 데이터 초기 분류로 재연산 최소화
 *
 * 4. 실시간 탭 카운트 제공
 *   - 모든 탭의 정확한 게시글 수 표시
 *   - 탭 변경 시 즉시 반영
 *
 * 🔄 수정사항 (2024.02.15):
 * 1. 디버깅 로그 추가
 *   - API 응답 데이터 상세 로깅
 *   - 상태 변경 추적 강화
 *
 * 2. 데이터 처리 로직 개선
 *   - 상태 분류 정확성 향상
 *   - 데이터 매핑 과정 상세화
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage } from "@/components/auth/utils/tokenUtils";
import { TabType } from "@/components/Mypage/TabGroup/types";
import {
  TradePost,
  ApiTradePost,
  CommunityPost,
  ReviewPost,
} from "@/components/Mypage/PostCard/types";

// const API_BASE_URL = "http://3.36.40.240:8001";

interface MyPageData {
  ongoingTradePosts: TradePost[];
  completedTradePosts: TradePost[];
  communityPosts: CommunityPost[];
  reviews: ReviewPost[];
}

export const useMyPosts = (currentTab: TabType) => {
  const router = useRouter();
  const [allData, setAllData] = useState<MyPageData>({
    ongoingTradePosts: [],
    completedTradePosts: [],
    communityPosts: [],
    reviews: [],
  });
  const [currentPosts, setCurrentPosts] = useState<
    (TradePost | CommunityPost | ReviewPost)[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * ✨ 데이터 로딩 및 상태 업데이트
   * @description
   * - 3개 API 병렬 호출 (거래/커뮤니티/후기)
   * - 응답 데이터 가공 및 상태 업데이트
   * - Number 타입 변환으로 카운트 정확성 보장
   */
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = TokenStorage.getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // API 호출 시작 로깅
      console.log("🔄 API 호출 시작");

      const [tradeResponse, communityResponse, reviewResponse] =
        await Promise.all([
          fetch(`/api/users/trade-posts`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "*/*",
            },
          }),
          fetch(`/api/users/community-posts`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "*/*",
            },
          }),
          fetch(`/api/users/trade-reviews`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "*/*",
            },
          }),
        ]);

      if (!tradeResponse.ok || !communityResponse.ok || !reviewResponse.ok) {
        const errorData = await tradeResponse.json();
        throw new Error(errorData.message || "데이터 로딩 실패");
      }

      const [tradePosts, communityPosts, reviews] = await Promise.all([
        tradeResponse.json() as Promise<ApiTradePost[]>,
        communityResponse.json() as Promise<CommunityPost[]>,
        reviewResponse.json() as Promise<ReviewPost[]>,
      ]);

      // ⭐️ 추가: API 응답 데이터 상세 로깅
      console.log("📦 API 응답 원본 데이터:", {
        tradePosts,
        communityPosts,
        reviews,
      });

      // ⭐️ 추가: 거래 게시글 상태값 상세 로깅
      console.log(
        "🔍 거래 게시글 상태 확인:",
        tradePosts.map((post) => ({
          id: post.id,
          title: post.title,
          state: post.state,
          createdAt: post.createdAt,
        }))
      );

      // ⭐️ 추가: 데이터 필터링 전 게시글 수 로깅
      console.log("📊 필터링 전 게시글 수:", {
        전체_거래게시글: tradePosts.length,
        TRADING상태_게시글: tradePosts.filter(
          (post) => post.state === "TRADING"
        ).length,
        COMPLETED상태_게시글: tradePosts.filter(
          (post) => post.state === "COMPLETED"
        ).length,
      });

      // 데이터 분류 및 변환
      const processedData = {
        ongoingTradePosts: tradePosts
          .filter((post) => {
            // ⭐️ 추가: 필터링 과정 상세 로깅
            const isTrading = post.state === "TRADING";
            console.log(`게시글 ID ${post.id}: TRADING 상태 = ${isTrading}`);
            return isTrading;
          })
          .map((post) => ({
            ...post,
            state: "게시중" as const,
            viewCount: Number(post.viewCount) || 0,
            likeCount: Number(post.likeCount) || 0,
            chatRoomCount: Number(post.chatRoomCount) || 0,
          })),
        completedTradePosts: tradePosts
          .filter((post) => {
            // ⭐️ 추가: 필터링 과정 상세 로깅
            const isCompleted = post.state === "COMPLETED";
            console.log(
              `게시글 ID ${post.id}: COMPLETED 상태 = ${isCompleted}`
            );
            return isCompleted;
          })
          .map((post) => ({
            ...post,
            state: "게시완료" as const,
            viewCount: Number(post.viewCount) || 0,
            likeCount: Number(post.likeCount) || 0,
            chatRoomCount: Number(post.chatRoomCount) || 0,
          })),
        communityPosts: communityPosts.map((post) => ({
          ...post,
          viewCount: Number(post.viewCount) || 0,
          bookmarkCount: Number(post.bookmarkCount) || 0,
          commentCount: Number(post.commentCount) || 0,
        })),
        reviews,
      };

      // ⭐️ 추가: 데이터 처리 결과 상세 로깅
      console.log("📊 데이터 처리 결과:", {
        게시중: {
          개수: processedData.ongoingTradePosts.length,
          게시글목록: processedData.ongoingTradePosts.map((p) => ({
            id: p.id,
            title: p.title,
            state: p.state,
          })),
        },
        게시완료: {
          개수: processedData.completedTradePosts.length,
          게시글목록: processedData.completedTradePosts.map((p) => ({
            id: p.id,
            title: p.title,
            state: p.state,
          })),
        },
      });

      setAllData(processedData);

      // ⭐️ 추가: 최종 상태 업데이트 확인
      console.log("✅ 최종 데이터 상태:", {
        거래게시글: tradePosts.length,
        커뮤니티게시글: communityPosts.length,
        후기: reviews.length,
        현재탭: currentTab,
      });
    } catch (err) {
      console.error("❌ 데이터 로딩 에러:", err);
      setError(err instanceof Error ? err : new Error("데이터 로딩 실패"));
      if (err instanceof Error && err.message.includes("토큰")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router, currentTab]);

  /**
   * ✨ 데이터 리프레시 함수
   * @description
   * - 상호작용 발생 시 호출
   * - 최신 데이터로 상태 갱신
   */
  const refresh = useCallback(async () => {
    try {
      console.log("🔄 데이터 리프레시 시작");
      await loadAllData();
      console.log("✨ 데이터 리프레시 완료");
    } catch (err) {
      console.error("❌ 데이터 리프레시 실패:", err);
    }
  }, [loadAllData]);

  // ✨ 초기 데이터 로드
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ✨ 정확한 게시글 수 계산
  const postCounts = useMemo(
    () => ({
      게시중: allData.ongoingTradePosts.length,
      게시완료: allData.completedTradePosts.length,
      "내 커뮤니티": allData.communityPosts.length,
      "받은 후기": allData.reviews.length,
    }),
    [allData]
  );

  // ✨ 현재 탭에 따른 게시글 필터링
  useEffect(() => {
    console.log("📑 현재 탭:", currentTab);
    console.log("🗃 전체 데이터 상태:", allData);

    switch (currentTab) {
      case "게시중":
        setCurrentPosts(allData.ongoingTradePosts);
        break;
      case "게시완료":
        setCurrentPosts(allData.completedTradePosts);
        break;
      case "내 커뮤니티":
        setCurrentPosts(allData.communityPosts);
        break;
      case "받은 후기":
        setCurrentPosts(allData.reviews);
        break;
      default:
        setCurrentPosts([]);
    }
  }, [currentTab, allData]);

  return {
    posts: currentPosts,
    postCounts,
    loading,
    error,
    refresh,
  };
};
