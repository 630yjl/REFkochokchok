// src/commons/navigation/TopNavBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { NavType } from "./NavWrapper";

interface TopNavBarProps {
  title?: string;   // 페이지 제목
  type: NavType;    // 네비게이션 바 타입
}

const TopNavBar = ({ title = "", type }: TopNavBarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * 타이틀 렌더링 함수
   * - 채팅방의 경우 특별한 스타일링 적용
   * - "님과의 채팅" 형식인 경우 이름 부분만 primary 컬러로 강조
   */
  const renderTitle = () => {
    // 채팅방 타이틀 패턴 확인 ("...님과의 채팅" 형식)
    const chatPattern = /^(.+)님과의 채팅$/;
    const match = title.match(chatPattern);

    if (match) {
      // 상대방 이름만 추출
      const name = match[1];
      return (
        <div className="flex items-center">
          {/* text-primary 클래스로 컬러 적용 */}
          <span className="text-title-lg">{name}</span>
          {/* <span className="text-primary font-medium">{name}</span>
          <span className="ml-1">님과의 채팅</span> */}
        </div>
      );
    }

    // 일반 타이틀은 그대로 반환
    return title;
  };

/**
   * 뒤로가기 버튼 클릭 핸들러
   * - 게시물 작성 페이지: 목록으로 이동
   * - 커뮤니티 상세 페이지: 커뮤니티 목록으로 이동
   * - 구인/중고 상세 페이지: 구인/중고 목록으로 이동
   * - 그 외: 이전 페이지로 이동
   */
const handleBack = () => {
  // 게시물 작성 페이지 특수 처리
  if (pathname === '/jobList/new') {
    router.push('/jobList');
    return;
  }
  
  // 커뮤니티 상세 페이지인 경우 커뮤니티 목록으로 이동
  if (/^\/communityBoard\/\d+$/.test(pathname)) {
    router.push('/communityBoard');
    return;
  }
  
  // 구인/중고 상세 페이지인 경우 구인/중고 목록으로 이동
  if (/^\/jobList\/\d+$/.test(pathname)) {
    router.push('/jobList');
    return;
  }
  
  // 기본 동작: 이전 페이지로 이동
  router.back();
};

  return (
    <header className="z-[1000] fixed top-0 left-0 w-screen h-12 bg-nav-bg">
      <div className="h-12 flex justify-between items-center">
        {/* 뒤로가기 버튼 영역 */}
        {type !== 'onlyTitle' && (
          <button
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center"
          >
            <Image
              src="/icons/Back_icon_24px.svg"
              width={24}
              height={24}
              alt="뒤로가기"
            />
          </button>
        )}

        {/* 타이틀 영역 */}
        {type !== 'onlyBack' && (
          <h1 
            className={`
              text-title-xl
              ${type === 'onlyTitle' ? 'absolute left-1/2 -translate-x-1/2' : ''}
              ${title.includes('님과의 채팅') ? 'flex items-center' : ''}
            `}
          >
            {renderTitle()}
          </h1>
        )}

        {/* 레이아웃 균형을 위한 더미 요소 */}
        <div className="w-11" aria-hidden="true" />
      </div>
    </header>
  );
};

export default TopNavBar;