import Link from "next/link";
import Image from "next/image";

export default function ChatListItem() {
  return (
    <>
      <Link href="../chatList/chatRoom">
        <div className="flex p-4 px-5 justify-between items-start self-stretch backdrop-blur-[2px]">
          <div className="flex">
            <div
              className="w-12 h-12 rounded-3xl bg-center bg-cover bg-no-repeat flex-shrink-0"
              style={{
                backgroundImage: "url('/path-to-image')", // 여기서 이미지를 적용
                backgroundColor: "#d3d3d3", // 원하는 배경색 (예: 빨간색)
              }}
            ></div>
            <div className="ml-[1rem] mr-[0.5rem]">
              <div className="flex flex-row items-center gap-1">
                <span className="overflow-hidden text-ellipsis text-[#26220D] font-suit text-[1rem] font-semibold leading-[1.5rem] tracking-[-0.025rem]">
                  닉네임
                </span>
                <span> ・ </span>
                <span className="text-[#545245] text-xs font-normal leading-[1.125rem] tracking-[-0.01875rem] font-suit">
                  1분 전
                </span>
              </div>
              <div>
                <p className="overflow-hidden text-ellipsis text-[#8D8974] text-[0.875rem] font-normal leading-[1.3125rem] tracking-[-0.02188rem]">
                  내용을 입력해주세요. 내용을 입력해주세요. 내용을 입력해주세요.
                  내용을 입력해주세요. 내용을 입력해주세요. 내용을 입력해주세요.
                </p>
              </div>
            </div>
          </div>
          <div>
            <Image
              className="min-w-[1.875rem]"
              src="/icons/cancel_icon_24px.svg" // 로컬 파일 경로
              alt="Cancel Icon"
              width={30} // 크기
              height={30}
            />
          </div>
        </div>
      </Link>
    </>
  );
}
