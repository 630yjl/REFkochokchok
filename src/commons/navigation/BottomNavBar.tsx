/**
 * BottomNavBar 컴포넌트
 * 
 * 주요 기능:
 * 1. 앱 하단 네비게이션 바 렌더링 (Fixed 포지션)
 * 2. 홈, 채팅, 찜, MY 페이지 빠른 이동 아이콘 제공
 * 3. 현재 활성화된 메뉴 하이라이트 처리 (아이콘 및 텍스트 색상 변경)
 * 4. 둥근 모서리 디자인 및 그림자 효과 적용
 */

// src/commons/BottomNavBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // 네비게이션 아이템 정의 - 각 아이템은 라벨, 경로, 아이콘 정보를 포함
  const navItems = [
    {
      label: "홈",
      path: "/",
      icon: "/icons/nav/nav_home_unselected_icon.svg",
      activeIcon: "/icons/nav/nav_home_selected_icon.svg",
    },
    
    {
      label: "채팅",
      path: "/chatList",
      icon: "/icons/nav/nav_chat_unselected_icon.svg",
      activeIcon: "/icons/nav/nav_chat_selected_icon.svg",
    },
    
    {
      label: "찜",
      path: "/bookmark",
      icon: "/icons/nav/nav_bookmark_unselected_icon.svg",
      activeIcon: "/icons/nav/nav_bookmark_selected_icon.svg",
    },
    {
      label: "MY",
      path: "/mypage",
      icon: "/icons/nav/nav_mypage_unselected_icon.svg",
      activeIcon: "/icons/nav/nav_mypage_selected_icon.svg",
    },
  ];

  return (
    <nav className="z-50 h-[3.875rem] bg-nav-bg fixed bottom-0 left-0 w-screen border rounded-tr-[2.625rem] rounded-tl-[2.625rem] border-list-line shadow-[0_-0.25rem_2rem_0_rgba(0,0,0,0.15)]">
      <div className="h-full max-w-screen-sm mx-auto px-6 py-2">
        <ul className="flex h-full justify-between items-center">
          {/* 네비게이션 아이템 맵핑 */}
          {navItems.map((item) => {
            // 현재 경로와 아이템 경로가 일치하는지 확인
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center gap-1 px-2 py-1"
                >
                  {/* 활성화 상태에 따라 아이콘 변경 */}
                  <Image
                    src={isActive ? item.activeIcon : item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                  />
                  {/* 활성화 상태에 따라 텍스트 스타일 변경 */}
                  <span
                    className={`text-xs ${
                      isActive
                        ? "text-primary font-bold"       // 활성화: 초록색(primary) + 굵게
                        : "text-text-quaternary font-medium" // 비활성화: 회색 + 중간 굵기
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}