// src/components/Bookmark/hook.ts

import { useState, useEffect, useMemo } from 'react';
import { BookmarkedPost, WishlistedPost } from '@/components/Bookmark/PostCard/types';
import { TabType } from '@/components/Bookmark/TabGroup/types';

export const useMyPosts = (currentTab: TabType) => {
  const [allData, setAllData] = useState<{
    wishlistPosts: WishlistedPost[];
    bookmarkPosts: BookmarkedPost[];
  }>({
    wishlistPosts: [],
    bookmarkPosts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  // 모든 탭의 게시물 수 계산
  const postCounts = useMemo(() => ({
    "찜": allData.wishlistPosts.length,
    "북마크": allData.bookmarkPosts.length
  }), [allData]);

   // 현재 탭에 따른 게시물 필터링
  const currentPosts = useMemo(() => {
    return currentTab === "찜" 
      ? allData.wishlistPosts 
      : allData.bookmarkPosts;
  }, [currentTab, allData]);

  const toggleLike = (postId: number, isLiked: boolean) => {
    console.log('🔍 toggleLike 호출:', { postId, isLiked });
    
    // 찜하기 해제를 대기 상태로 표시
    if (!isLiked) {
      console.log('🕒 찜 해제 대기:', postId);
    }
  };

  const toggleBookmark = (postId: number, isBookmarked: boolean) => {
    console.log('🔍 toggleBookmark 호출:', { postId, isBookmarked });
    
    // 북마크 해제를 대기 상태로 표시
    if (!isBookmarked) {
      console.log('🕒 북마크 해제 대기:', postId);
    }
  };


  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 토큰 가져오기
        const tokenStorageStr = localStorage.getItem("token-storage");
        if (!tokenStorageStr) {
          throw new Error('로그인 정보가 없습니다.');
        }
        
        const tokenData = JSON.parse(tokenStorageStr);
        const token = tokenData?.accessToken;

        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        // 병렬로 API 요청
        const [wishlistResponse, bookmarkResponse] = await Promise.all([
          fetch('/api/users/trade-posts/liked', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': '*/*'
            }
          }),
          fetch('/api/users/community-posts/bookmarked', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': '*/*'
            }
          })
        ]);

        // 응답 처리
        if (!wishlistResponse.ok || !bookmarkResponse.ok) {
          const errorData = await wishlistResponse.json();
          throw new Error(errorData.message || '데이터를 불러오는데 실패했습니다.');
        }

        const wishlistPosts = await wishlistResponse.json();
        const bookmarkPosts = await bookmarkResponse.json();

        // 데이터 상태 업데이트
        setAllData({
          wishlistPosts,
          bookmarkPosts
        });

      } catch (err) {
        console.error('게시글 불러오기 실패:', err);
        setError(err instanceof Error ? err : new Error('알 수 없는 에러가 발생했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return { 
    posts: currentPosts, 
    postCounts, 
    loading, 
    error,
    toggleLike,    
    toggleBookmark  
  };
};