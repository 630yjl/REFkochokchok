// src/components/Bookmark/index.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TabGroup from "./TabGroup";
import { useMyPosts } from "./hook";
import PostCard from "./PostCard";
import { TabType } from "./TabGroup/types";
import { Post } from "./PostCard/types";

export default function BookmarkComponent() {
  // 라우터 초기화
  const router = useRouter();

  // 현재 선택된 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<TabType>("찜");

  // 게시글 데이터 및 상태 가져오기
  const { posts, postCounts, loading, error,  toggleLike,  toggleBookmark   } = useMyPosts(currentTab);

  /**
   * 탭 변경 핸들러
   * @param tab 선택된 새로운 탭
   */
  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  /**
   * 게시글 클릭 핸들러
   * @param postId 클릭된 게시글의 ID
   */
  const handlePostClick = (postId: number) => {
    switch (currentTab) {
      case "찜":
        router.push(`/jobList/${postId}`);
        break;
      case "북마크":
        router.push(`/communityBoard/${postId}`);
        break;
    }
  };

  // 로딩 상태 UI
  if (loading) {
    return <div className="text-sm-medium text-center py-4">로딩 중...</div>;
  }

  // 에러 상태 UI
  if (error) {
    return (
      <div className="text-sm-medium text-error text-center py-4">
        에러가 발생했습니다: {error.message}
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col min-h-screen bg-background">
      {/* 탭 그룹 영역 - postCounts prop 전달 */}
      <div className="sticky top-12 z-50 bg-background">
        <TabGroup
          currentTab={currentTab}
          onTabChange={handleTabChange}
          postCounts={postCounts}
        />
      </div>

      {/* 게시글 목록 영역 */}
      <div className="flex-1 px-5 ">
        {(!posts || posts.length === 0) && (
          <div className="text-sm-medium text-center py-4">
            게시글이 없습니다.
          </div>
        )}

        {posts.map((post: Post) => (
          <PostCard key={post.id} post={post} onPostClick={handlePostClick} onToggleLike={toggleLike} onToggleBookmark={toggleBookmark}/>
        ))}
      </div>
    </main>
  );
}