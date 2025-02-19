// src/components/Mypage/index.tsx
"use client";

/**
 * 마이페이지 컴포넌트
 * 
 * 주요 기능:
 * 1. 프로필 카드 표시 및 수정 페이지 연결
 * 2. 게시글 상태별 탭 관리 (게시중/게시완료/내 커뮤니티/받은 후기)
 * 3. URL 파라미터를 통한 탭 상태 관리
 * 4. 무한 스크롤을 통한 게시글 목록 표시
 * 5. 게시글 타입별 상세 페이지 라우팅
 * 6. 로딩 및 에러 상태 처리
 * 7. BottomSheetModal을 통한 게시글 관리 기능 제공
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import ProfileCard from "./ProfileCard";
import TabGroup from "./TabGroup";
import { useMyPosts } from "./hook";
import PostCard from "./PostCard";
import { TabType } from "./TabGroup/types";
import { Post, isTradePost, isCommunityPost } from "./PostCard/types";
import { TokenStorage } from "@/components/auth/utils/tokenUtils";
import BottomSheetModal, {
  BottomSheetMenuItem,
} from "@/commons/BottomSheetModal";
import { toast } from "react-hot-toast";

export default function MypageComponent() {
  // 1️⃣ 컴포넌트 초기 설정
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TabType>("게시중");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 2️⃣ 무한 스크롤 관련 상태 추가
  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  const { ref: scrollRef, inView } = useInView({
    threshold: 0.1,
  });

  // 3️⃣ 게시글 데이터 및 상태 관리
  const { posts, postCounts, loading, error, refresh } = useMyPosts(currentTab);

  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // 4️⃣ 게시글 페이지네이션 및 무한 스크롤 로직
  useEffect(() => {
    const paginatedPosts = posts.slice(0, page * POSTS_PER_PAGE);
    setDisplayPosts(paginatedPosts);
    setHasMore(paginatedPosts.length < posts.length);
  }, [posts, page]);

  useEffect(() => {
    if (inView && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, hasMore]);

  // 5️⃣ 탭 변경 처리
  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setPage(1);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", tab);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  // 6️⃣ 게시글 클릭 처리
  const handlePostClick = (id: number, post: Post) => {
    if (isTradePost(post)) {
      router.push(`/jobList/${id}`);
    } else if (isCommunityPost(post)) {
      router.push(`/communityBoard/${id}`);
    }
  };

  // 7️⃣ 더보기 버튼 클릭 처리
  const handleMoreClick = (post: Post) => {
    setSelectedPost(post);
    setIsBottomSheetOpen(true);
  };

  // 8️⃣ BottomSheetModal 메뉴 아이템 생성
  const getBottomSheetMenuItems = (
    post: Post | null,
    currentTab: TabType
  ): BottomSheetMenuItem[] => {
    if (!post || currentTab === "받은 후기") return [];

    const menuItems: BottomSheetMenuItem[] = [];

    // 게시중 상태일 때만 상태 변경 버튼 표시
    if (currentTab === "게시중") {
      const handleStateChange = async (postId: number) => {
        if (isProcessing) return;

        try {
          setIsProcessing(true);
          const token = TokenStorage.getAccessToken();

          const response = await fetch(`/api/trade/${postId}/state`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "*/*",
            },
            body: JSON.stringify({ state: "COMPLETED" }),
          });

          if (!response.ok) {
            throw new Error("상태 변경에 실패했습니다");
          }

          // 여기에 탭 변경 로직 추가
        setCurrentTab("게시완료");
        
        // URL 파라미터도 함께 업데이트
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("tab", "게시완료");
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.pushState({}, "", newUrl);
          await refresh();
          setIsBottomSheetOpen(false);
          toast.success("게시완료로 변경되었습니다.");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "상태 변경에 실패했습니다";
          alert(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      };

      menuItems.push({
        label: isProcessing ? "처리 중..." : "게시완료로 변경",
        onClick: async () => {
          if (!isProcessing && post) {
            await handleStateChange(post.id);
          }
        },
        type: "default",
      });
    }

    // 공통 메뉴 아이템 추가
    menuItems.push(
      {
        label: "게시글 수정",
        onClick: () => {
          if (isTradePost(post)) {
            router.push(`/jobList/${post.id}/edit`);
          } else if (isCommunityPost(post)) {
            router.push(`/communityBoard/${post.id}/edit`);
          }
        },
        type: "default",
      },
      {
        label: "삭제",
        onClick: async () => {
          try {
            const token = TokenStorage.getAccessToken();
            const url = isCommunityPost(post)
              ? `/api/community/${post.id}`
              : `/api/trade/${post.id}`;

            const response = await fetch(url, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              await refresh();
              setIsBottomSheetOpen(false);
            } else {
              throw new Error("삭제 실패");
            }
          } catch (error) {
            console.error("게시글 삭제 실패:", error);
            alert("게시글 삭제에 실패했습니다.");
          }
        },
        type: "danger",
      },
      {
        label: "창 닫기",
        onClick: () => setIsBottomSheetOpen(false),
        type: "cancel",
      }
    );

    return menuItems;
  };

  // 9️⃣ 컴포넌트 렌더링
  return (
    <main className="flex flex-col px-5 min-h-screen bg-background">
      {/* 프로필 카드 섹션 */}
      <div className="py-5">
        <ProfileCard onEditClick={() => router.push("/mypage/edit")} />
      </div>

      {/* 탭 그룹 섹션 */}
      <div className="sticky top-12 z-50 bg-background">
        <TabGroup
          currentTab={currentTab}
          onTabChange={handleTabChange}
          postCounts={postCounts}
        />
      </div>

      {/* 로딩 상태 표시 */}
      {loading && (
        <div className="text-sm-medium text-center py-4">로딩 중...</div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="text-sm-medium text-error text-center py-4">
          에러가 발생했습니다: {error.message}
        </div>
      )}

      {/* 게시글 목록 섹션 */}
      <div className="flex-1">
        {(!displayPosts || displayPosts.length === 0) && (
          <div className="text-sm-medium text-center py-4">
            게시글이 없습니다.
          </div>
        )}

        {displayPosts.map((post: Post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostClick={(id) => handlePostClick(id, post)}
            onMoreClick={handleMoreClick}
          />
        ))}

        {/* 무한 스크롤 감지 요소 */}
        {hasMore && (
          <div ref={scrollRef} className="h-10">
            <div className="text-center py-4 text-gray-500">
              게시글을 더 불러오는 중...
            </div>
          </div>
        )}

        {!hasMore && displayPosts.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            모든 게시글을 불러왔습니다.
          </div>
        )}
      </div>

      {/* BottomSheetModal */}
      <BottomSheetModal
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        menuItems={getBottomSheetMenuItems(selectedPost, currentTab)}
      />
    </main>
  );
}