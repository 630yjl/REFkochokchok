import { useState } from 'react';
import { Post, isWishlistedPost, isBookmarkedPost } from './types';

export const usePostCard = (post: Post) => {
  const [likeCount, setLikeCount] = useState(
    isWishlistedPost(post) ? post.likeCount : 0
  );
  const [bookmarkCount, setBookmarkCount] = useState(
    isBookmarkedPost(post) ? post.bookmarkCount : 0
  );
  const [isLiked, setIsLiked] = useState(
    isWishlistedPost(post) ? post.isLiked : false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    isBookmarkedPost(post) ? post.isBookmarked : false
  );

  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  const handleLikeToggle = async (onToggleLike?: (postId: number, isLiked: boolean) => void) => {
    if (!isWishlistedPost(post)) return;

    const token = getAccessToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/trade/${post.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': '*/*'
        },
        body: ''
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '좋아요 토글에 실패했습니다.');
      }

      const newLikedState = !isLiked;
      
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      if (onToggleLike) {
        onToggleLike(post.id, newLikedState);
      }
    } catch (error) {
      console.error('좋아요 토글 중 오류:', error);
      alert(error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBookmarkToggle = async (onToggleBookmark?: (postId: number, isBookmarked: boolean) => void) => {
    if (!isBookmarkedPost(post)) return;

    const token = getAccessToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/community/${post.id}/bookmark`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': '*/*'
        },
        body: ''
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '북마크 토글에 실패했습니다.');
      }

      const newBookmarkedState = !isBookmarked;
      
      setIsBookmarked(newBookmarkedState);
      setBookmarkCount(prev => newBookmarkedState ? prev + 1 : prev - 1);
      
      if (onToggleBookmark) {
        onToggleBookmark(post.id, newBookmarkedState);
      }
    } catch (error) {
      console.error('북마크 토글 중 오류:', error);
      alert(error instanceof Error ? error.message : '북마크 처리 중 오류가 발생했습니다.');
    }
  };

  return {
    likeCount,
    bookmarkCount,
    isLiked,
    isBookmarked,
    handleLikeToggle,
    handleBookmarkToggle
  };
};