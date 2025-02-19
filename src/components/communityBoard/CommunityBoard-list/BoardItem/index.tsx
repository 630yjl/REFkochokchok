"use client";

import Image from "next/image";
import Link from "next/link";
export default function CommunityBoardItem({ post }: { post: any }) {
  return (
    <>
      {/* Post Items */}
      <Link href={`/communityBoard/${post.id}`}>
        <div className="flex gap-4 w-full bg-white p-4 hover:bg-gray-50 text-left border-b-[1.5px] border-[#E9E8E3]">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {post.writeUserName}
              </span>
              <span>•</span>
              <span>
                {(() => {
                  const date = new Date(post.createdAt);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0"); // 2월 → 02
                  const day = String(date.getDate()).padStart(2, "0"); // 7일 → 07
                  return `${year}-${month}-${day}`; // YYYY-MM-DD 형식으로 반환
                })()}
              </span>
            </div>
            <h2 className="font-medium mt-1 mb-1">{post.title}</h2>
            <p className="text-gray-600 text-sm line-clamp-2">
              {post.contents}
            </p>
            <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
              <div className="flex items-center">
                <Image
                  className="w-full h-full"
                  src="/icons/post_list_view_icon_24px.svg" // 조회수
                  alt="Cancel Icon"
                  width={0} // 크기
                  height={0}
                />
                <span>{post.viewCount}</span>
              </div>
              <div className="flex items-center">
                <Image
                  className="w-full h-full"
                  src="/icons/community_detail_bookmark_24px.svg" // 저장수
                  alt="Cancel Icon"
                  width={0} // 크기
                  height={0}
                />
                <span>{post.bookmarkCount}</span>
              </div>
              <div className="flex items-center">
                <Image
                  className="w-full h-full"
                  src="/icons/post_list_chat_icon_24px.svg" // 댓글수
                  alt="Cancel Icon"
                  width={0} // 크기
                  height={0}
                />
                <span>{post.commentCount}</span>
              </div>
            </div>
          </div>
          <div className="w-[8rem] h-[8rem] min-w-[6.25rem] min-h-[6.25rem]">
            <div
              className="w-full h-full rounded-2xl bg-center bg-cover bg-no-repeat flex-shrink-0"
              style={{
                backgroundImage: `url(${post.thumbnailImage})`,
                backgroundColor: "#d3d3d3", // 썸네일이 없다면?
              }}
            ></div>
          </div>
        </div>
      </Link>
    </>
  );
}
