"use client";
import RegionDropdown from "@/commons/regionsDropdown";
import Image from "next/image";
import useJobBoardList from "./hook";

const JobBoardList = () => {
  const {
    boards,
    isLoading,
    selectedMainRegion,
    setSelectedMainRegion,
    selectedSubRegion,
    setSelectedSubRegion,
    writeButton,
    router,
    lastBoardElementRef,
  } = useJobBoardList();

  return (
    <section className="p-5">
      <RegionDropdown
        selectedMainRegion={selectedMainRegion}
        setSelectedMainRegion={setSelectedMainRegion}
        selectedSubRegion={selectedSubRegion}
        setSelectedSubRegion={setSelectedSubRegion}
      />
      <ul>
        {boards?.map((board, index) => (
          <li
            key={board.id}
            className="flex flex-col items-center gap-3 w-full pb-4 pt-4 border-b-[1.5px] border-borderBottom"
            ref={boards.length === index + 1 ? lastBoardElementRef : null}
            onClick={() => router.push(`/jobList/${board.id}`)}
          >
            <article className="flex items-center w-full rounded-lg">
              {/* 이미지 */}
              <div
                className="w-[100px] h-[100px] rounded-[12px] bg-cover bg-no-repeat bg-center bg-gray-300"
                style={{
                  backgroundImage: `url(${board.thumbnailImage || ""})`,
                }}
                aria-label="게시글 대표 이미지"
              ></div>

              {/* 텍스트 */}
              <div className="ml-4 flex-1">
                <header>
                  <h2 className="text-text-primary text-section font-semibold leading-[1.5] tracking-[-0.025rem]">
                    {board.title}
                  </h2>
                  <p className="text-text-tertiary font-suit text-sm font-medium leading-[1.5] tracking-[-0.021875rem]">
                    {board.region} ·{" "}
                    {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </header>
                <p className="text-base-semibold mt-1 text-text-primary">
                  {Number(board.price).toLocaleString()}원
                </p>

                {/* 상태 및 아이콘 */}
                <div className="text-sm flex items-center mt-1 justify-between">
                  <div className="flex space-x-1">
                    <div
                      className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center bg-cover bg-no-repeat bg-center"
                      style={{
                        backgroundImage: `url(${
                          board.writeUserProfileImage || ""
                        })`,
                      }}
                    />
                    <span className="text-sm text-text-quaternary">
                      {board.writeUserName}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <span key={board.id} className="flex items-center">
                      <Image
                        src={`/icons/post_list_view_icon_24px.svg`}
                        alt={`view 카운트`}
                        width={24}
                        height={24}
                      />
                      <span className="text-text-quaternary font-suit text-[0.875rem] text-sm leading-[1.5] tracking-[-0.021875rem]">
                        {board.viewCount}
                      </span>

                      <Image
                        src={`/icons/post_list_like_icon_24px.svg`}
                        alt={`like 카운트`}
                        width={24}
                        height={24}
                      />
                      <span className="text-text-quaternary font-suit text-[0.875rem] text-sm leading-[1.5] tracking-[-0.021875rem]">
                        {board.likeCount}
                      </span>

                      <Image
                        src={`/icons/post_list_chat_icon_24px.svg`}
                        alt={`chat 카운트`}
                        width={24}
                        height={24}
                      />
                      <span className="text-text-quaternary font-suit text-[0.875rem] text-sm leading-[1.5] tracking-[-0.021875rem]">
                        {board.chatRoomCount}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {/* 무한 스크롤 트리거 */}
      <div className="h-4" />
      {isLoading && (
        <div className="text-center p-4">데이터를 불러오는 중...</div>
      )}
      {boards.length > 0 && (
        <div className="text-center p-4 text-gray-500">
          더 이상 게시물이 없습니다.
        </div>
      )}

      {/* 하단 고정 버튼 */}
      <button
        onClick={writeButton}
        className="fixed bottom-[5.5rem] right-5 bg-primary flex h-[3.5rem] px-[1rem] justify-center items-center gap-[0.25rem] rounded-[3rem] shadow-[0_0.25rem_1.5625rem_rgba(0,0,0,0.25)]"
      >
        <div className="text-white flex gap-1 justify-center items-center">
          <Image
            src="/icons/icon-pencil-plus_icon_24px.svg"
            alt="글쓰기 아이콘"
            width={24}
            height={24}
          />
          <span>글쓰기</span>
        </div>
      </button>
    </section>
  );
};

export default JobBoardList;
