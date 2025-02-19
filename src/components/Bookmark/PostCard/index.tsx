import Image from "next/image";
import { usePostCard } from "@/components/Bookmark/PostCard/hook";
import {
  getRelativeTimeString,
  isBookmarkedPost,
  isWishlistedPost,
  PostCardProps,
} from "./types";

export default function PostCard({
  post,
  onPostClick,
  onToggleLike,
  onToggleBookmark,
}: PostCardProps) {
  const DEFAULT_THUMBNAIL = "/images/post_list_default_img_100px.svg";
  const DEFAULT_PROFILE = "/images/post_list_profile_default_img_20px.svg";

  const {
    likeCount,
    bookmarkCount,
    isLiked,
    isBookmarked,
    handleLikeToggle,
    handleBookmarkToggle,
  } = usePostCard(post);

  // 🌟 공통 프로필 이미지 렌더링 함수
  // 이미지 로드 실패 시 기본 이미지로 대체하는 로직 구현
  const renderProfileImage = (imageUrl: string | undefined) => {
    console.log(`Profile Image URL: ${imageUrl ?? "undefined"}`); // 수정된 로깅

    return (
      <div className="relative w-5 h-5 rounded-full overflow-hidden">
        <Image
          src={imageUrl || DEFAULT_PROFILE}
          alt="프로필"
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = DEFAULT_PROFILE;
            console.log(
              `Image load failed. URL was: ${imageUrl ?? "undefined"}`
            ); // 수정된 에러 로깅
          }}
        />
      </div>
    );
  };

  // 찜 거래 게시글 렌더링
  if (isWishlistedPost(post)) {
    return (
      <div
        className="max-w-full py-5 flex flex-col border-b  border-list-line cursor-pointer"
        onClick={() => onPostClick(post.id)}
      >
        <div className="flex justify-between items-center gap-4 w-full  ">
          <div className="w-[6.25rem] h-[6.25rem] relative rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
            {post.thumbnailImage && (
              <Image
                src={post.thumbnailImage || DEFAULT_THUMBNAIL}
                alt={post.title}
                fill
                sizes="100px" //경고 해결 위해 작성 has "fill" but is missing "sizes" prop. Please add it to improve page performance.
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
                src={
                  isLiked
                    ? "/icons/bookmark-like_Page/like_on_24px.svg"
                    : "/icons/bookmark-like_Page/like_off_24px.svg"
                }
                alt="찜"
                width={24}
                height={24}
                style={{ width: "auto", height: "auto" }}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeToggle(onToggleLike);
                }}
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
                  <span className="text-sm-medium-quaternary">{likeCount}</span>
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

  // 북마크 커뮤니티 게시글 렌더링
  if (isBookmarkedPost(post)) {
    return (
      <div
        className="max-w-full py-5 flex flex-col border-b  border-list-line cursor-pointer"
        onClick={() => onPostClick(post.id)}
      >
        <div className="flex justify-between items-center gap-4 w-full  ">
          <div className="w-[6.25rem] h-[6.25rem] relative rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
            {post.thumbnailImage && (
              <Image
                src={post.thumbnailImage || DEFAULT_THUMBNAIL}
                alt={post.title}
                fill
                sizes="100px" //경고 해결 위해 작성 has "fill" but is missing "sizes" prop. Please add it to improve page performance.
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
                src={
                  isBookmarked
                    ? "/icons/bookmark-like_Page/bookmark_on_24px.svg"
                    : "/icons/bookmark-like_Page/bookmark_off_24px.svg"
                }
                alt="북마크"
                width={24}
                height={24}
                style={{ width: "auto", height: "auto" }}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmarkToggle(onToggleBookmark);
                }}
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
                    {bookmarkCount}
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

  return null;
}
