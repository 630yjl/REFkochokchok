// src/components/Mypage/PostCard/index.tsx

/**
 * PostCard 컴포넌트
 *
 * 주요 기능:
 * 1. 세 가지 타입의 게시글(거래/커뮤니티/후기) 조건부 렌더링
 * 2. 프로필 이미지 최적화 및 에러 핸들링
 *   - 20x20 픽셀 기본 프로필 이미지 처리
 *   - 이미지 로드 실패 시 기본 이미지 대체
 * 3. 게시글 클릭 시 상세 페이지 이동 처리
 * 4. 조회수, 좋아요, 채팅수 등 메타 정보 표시
 * 5. 작성 시간 상대 시간으로 표시 (예: '3시간 전')
 *
 * 🔄 개선 사항:
 * - 공통 프로필 이미지 렌더링 함수 도입
 * - 이미지 로딩 및 에러 핸들링 최적화
 * - 일관된 UI/UX 제공
 */

import Image from "next/image";
import {
  isTradePost,
  isCommunityPost,
  isReviewPost,
  getRelativeTimeString,
  PostCardProps,
  Post, // 🔑 Post 타입 추가 import
} from "./types";

// 컴포넌트 Props 인터페이스 정의
// interface PostCardProps {
//   post: Post;
//   onPostClick: (id: number) => void;
// }

export default function PostCard({
  post,
  onPostClick,
  onMoreClick,
}: PostCardProps) {
  // 🖼 기본 이미지 경로 상수화
  const DEFAULT_THUMBNAIL = "/images/post_list_default_img_100px.svg";
  const DEFAULT_PROFILE = "/images/post_list_profile_default_img_20px.svg";

  // 🌟 공통 프로필 이미지 렌더링 함수
  // 이미지 로드 실패 시 기본 이미지로 대체하는 로직 구현
  const renderProfileImage = (imageUrl: string | undefined) => {
    console.log(`Profile Image URL: ${imageUrl ?? 'undefined'}`); // 수정된 로깅
    
    return (
      <div className="relative w-5 h-5 rounded-full overflow-hidden">
        <Image
          src={imageUrl || DEFAULT_PROFILE}
          alt="프로필"
          fill
          sizes="20px" // 이미지 실제 크기에 맞게 설정
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = DEFAULT_PROFILE;
            console.log(`Image load failed. URL was: ${imageUrl ?? 'undefined'}`); // 수정된 에러 로깅
          }}
        />
      </div>
    );
  };

  // 💡 Type Assertion 추가로 타입 명시적 사용
  const currentPost: Post = post;

  const handleMoreClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();

    if (onMoreClick) {
      onMoreClick(currentPost); // Post 타입 명시적 사용
    }
  };
  // 🔍 거래 게시글 렌더링
  if (isTradePost(post)) {
    return (
      <div
        className="max-w-full py-5 flex flex-col border-b  border-list-line cursor-pointer"
        onClick={() => onPostClick(post.id)}
      >
        <div className="flex justify-between items-center gap-4 w-full  ">
          {/* 썸네일 이미지 렌더링 */}
          <div className="w-[6.25rem] h-[6.25rem] relative rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
            {post.thumbnailImage && (
              <Image
                src={post.thumbnailImage || DEFAULT_THUMBNAIL}
                alt={post.title}
                fill
                className="object-cover "
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/post_list_default_img_100px.svg";
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex flex-center gap-1">
              <h2 className="text-title-lg truncate overflow-hidden flex-1 min-w-0">
                {post.title}
              </h2>
              <Image
                src="/icons/dots_icon_24px.svg"
                alt="더보기"
                width={24}
                height={24}
                style={{ width: "auto", height: "auto" }}
                className="cursor-pointer flex-shrink-0"
                onClick={handleMoreClick}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm-medium">{post.region}</span>
              <span className="text-sm-medium">∙</span>
              <span className="text-sm-medium">
                {getRelativeTimeString(post.createdAt)}
              </span>
            </div>

            <div className="flex items-center">
              <span className="text-base-semibold">
                {post.price.toLocaleString()}원
              </span>
            </div>

            <div className="flex justify-between items-center">
              {/* 🆕 프로필 이미지 렌더링 함수 적용 */}
              <div className="flex items-center gap-1">
                {renderProfileImage(post.writeUserProfileImage)}
                <span className="text-sm-medium-quaternary">
                  {post.writeUserName}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <Image
                    src="/icons/post_list_view_icon_24px.svg"
                    alt="조회수"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.viewCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <Image
                    src="/icons/post_list_like_icon_24px.svg"
                    alt="좋아요"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.likeCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <Image
                    src="/icons/post_list_chat_icon_24px.svg"
                    alt="채팅"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.chatRoomCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🌐 커뮤니티 게시글 렌더링
  if (isCommunityPost(post)) {
    return (
      <div
        className="max-w-full py-5 flex flex-col border-b  border-list-line cursor-pointer"
        onClick={() => onPostClick(post.id)}
      >
        <div className="flex justify-between items-center gap-4 w-full  ">
          {/* 썸네일 이미지 렌더링 */}
          <div className="w-[6.25rem] h-[6.25rem] relative rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
            {post.thumbnailImage && (
              <Image
                src={post.thumbnailImage || DEFAULT_THUMBNAIL}
                alt={post.title}
                fill
                className="object-cover "
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/post_list_default_img_100px.svg";
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex flex-center gap-1">
              <h2 className="text-title-lg truncate flex-1 min-w-0">
                {post.title}
              </h2>
              <Image
                src="/icons/dots_icon_24px.svg"
                alt="더보기"
                width={24}
                height={24}
                style={{ width: "auto", height: "auto" }}
                className="cursor-pointer flex-shrink-0"
                onClick={handleMoreClick}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm-medium">
                {getRelativeTimeString(post.createdAt)}
              </span>
            </div>

            <div className="flex items-center">
              <span className="text-base-semibold truncate ">
                {post.contents}
              </span>
            </div>

            <div className="flex justify-between items-center">
              {/* 🆕 프로필 이미지 렌더링 함수 적용 */}
              <div className="flex items-center gap-1">
                {renderProfileImage(post.writeUserProfileImage)}
                <span className="text-sm-medium-quaternary">
                  {post.writeUserName}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <Image
                    src="/icons/post_list_view_icon_24px.svg"
                    alt="조회수"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.viewCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <Image
                    src="/icons/community_detail_bookmark_24px.svg"
                    alt="북마크아이콘"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.bookmarkCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <Image
                    src="/icons/post_list_chat_icon_24px.svg"
                    alt="덧글아이콘"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm-medium-quaternary">
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📝 후기 게시글 렌더링
  if (isReviewPost(post)) {
    return (
      <div className="p-5 border-b border-list-line">
        <div className="flex items-center gap-2">
          {/* 🆕 프로필 이미지 렌더링 함수 적용 */}
          {renderProfileImage(post.writeUserProfileImage)}
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm-medium">{post.writeUserName}</span>
              <span className="text-text-tertiary text-xs">
                {getRelativeTimeString(post.createdAt)}
              </span>
            </div>
            <div className="text-base-medium">{post.title}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
