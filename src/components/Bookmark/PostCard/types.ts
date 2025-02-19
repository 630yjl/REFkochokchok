// src/components/Mypage/PostCard/types.ts

/**
 * 게시글 관련 타입 정의
 * 
 * 포함 내용:
 * 1. 게시글 기본 타입 (거래/커뮤니티/후기)
 * 2. PostCard 컴포넌트 Props
 * 3. 타입가드 함수
 * 4. 유틸리티 함수
 */

/**
 * 거래 게시글 타입 (/api/users/trade-posts 응답)
 * @property {number} id - 게시글 고유 ID
 * @property {string} thumbnailImage - 섬네일 이미지 URL
 * @property {string} title - 게시글 제목
 * @property {string} region - 거래 지역
 * @property {number} price - 거래 가격
 * @property {string} contents - 게시글 내용
 * @property {string} state - 거래 상태
 * @property {string[]} images - 게시글 이미지 URL 배열
 * @property {number} writeUserId - 작성자 ID
 * @property {string} writeUserProfileImage - 작성자 프로필 이미지
 * @property {string} writeUserName - 작성자 이름
 * @property {number} likeCount - 좋아요 수
 * @property {number} viewCount - 조회수
 * @property {number} chatRoomCount - 채팅방 수
 * @property {boolean} isLiked - 좋아요 여부
 * @property {string} createdAt - 생성 시간
 * @property {string} updatedAt - 수정 시간
 */
export interface WishlistedPost {
  id: number;
  thumbnailImage: string;
  title: string;
  region: string;
  price: number;
  contents: string;
  state: string;
  images: string[];
  writeUserId: number;
  writeUserProfileImage: string;
  writeUserName: string;
  likeCount: number;
  viewCount: number;
  chatRoomCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 커뮤니티 게시글 타입 (/api/users/community-posts 응답)
 * @property {number} id - 게시글 고유 ID
 * @property {string} thumbnailImage - 섬네일 이미지 URL
 * @property {string} title - 게시글 제목
 * @property {string} contents - 게시글 내용
 * @property {string[]} images - 게시글 이미지 URL 배열
 * @property {number} writeUserId - 작성자 ID
 * @property {string} writeUserProfileImage - 작성자 프로필 이미지
 * @property {string} writeUserName - 작성자 이름
 * @property {number} bookmarkCount - 북마크 수
 * @property {number} viewCount - 조회수
 * @property {number} commentCount - 댓글 수
 * @property {boolean} isBookmarked - 북마크 여부
 * @property {string} createdAt - 생성 시간
 * @property {string} updatedAt - 수정 시간
 */
export interface BookmarkedPost {
  id: number;
  thumbnailImage: string;
  title: string;
  contents: string;
  images: string[];
  writeUserId: number;
  writeUserProfileImage: string;
  writeUserName: string;
  bookmarkCount: number;
  viewCount: number;
  commentCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * PostCard에서 사용할 통합 게시글 타입
 */
export type Post = WishlistedPost | BookmarkedPost ;

/**
 * PostCard 컴포넌트 Props 타입
 * @property {Post} post - 표시할 게시글 데이터
 * @property {function} onPostClick - 게시글 클릭 핸들러
 */
export interface PostCardProps {
  post: Post;
  onPostClick: (id: number) => void;
  onToggleLike?: (postId: number, isLiked: boolean) => void;
  onToggleBookmark?: (postId: number, isBookmarked: boolean) => void;
}

/**
 * 게시글 종류 구분을 위한 타입가드 함수들
 */
export const isWishlistedPost = (post: Post): post is WishlistedPost => {
  return 'price' in post;
};

export const isBookmarkedPost = (post: Post): post is BookmarkedPost => {
  return 'bookmarkCount' in post;
};



/**
 * 시간 표시 유틸리티 함수
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 현재 시간 기준 상대적 시간 표시
 * 
 * 표시 형식:
 * - 1분 미만: "방금 전"
 * - 1시간 미만: "X분 전"
 * - 24시간 미만: "X시간 전"
 * - 7일 미만: "X일 전"
 * - 30일 미만: "X주 전"
 * - 12개월 미만: "X개월 전"
 * - 12개월 이상: "X년 전"
 */
export const getRelativeTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // 시간 차이 계산 (밀리초 단위)
  const diffInMs = now.getTime() - date.getTime();
  
  // 분 단위 차이
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  
  // 시간 단위 차이
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  
  // 일 단위 차이
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}일 전`;
  
  // 주 단위 차이
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) return `${diffInWeeks}주 전`;
  
  // 월 단위 차이
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}개월 전`;
  
  // 년 단위 차이
  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears >= 1) return `${diffInYears}년 전`;
  
  // 위의 조건에 해당하지 않는 경우 절대 날짜 표시
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};