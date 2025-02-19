/**
 * NavWrapper 컴포넌트
 * 
 * 주요 기능:
 * 1. 앱 전체 네비게이션 관리 - 상단/하단 네비게이션 바 표시 여부 제어
 * 2. 페이지 경로 추적 및 동적 경로 처리 (예: /jobList/123 → /jobList/[boardId])
 * 3. 인증 보호 페이지 관리 (AuthGuard 통합)
 * 4. 페이지별 타이틀 관리 및 채팅방 특수 처리
 * 5. 수정 페이지에서 넘어온 상세 페이지의 백버튼 동작 개선
 */

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "../../commons/store/userStore";
import { AuthGuard } from "@/components/auth/components/AuthGuard";
import TopNavBar from "@/commons/navigation/TopNavBar";
import BottomNavBar from "@/commons/navigation/BottomNavBar";
import { TokenStorage } from "@/components/auth/utils/tokenUtils";

// 상단 네비게이션 바 타입 정의
export type NavType = "onlyBack" | "onlyTitle" | "default";

// 경로 이력을 저장할 전역 객체 - 앱 전체에서 네비게이션 히스토리 추적
export const navigationHistory = {
  prevPath: '',          // 이전 경로
  currentPath: '',       // 현재 경로
  isFromEditPage: false  // 수정 페이지에서 넘어왔는지 여부
};

// 네비게이션 설정을 위한 인터페이스
interface NavigationConfig {
  navType: Partial<Record<string, NavType>>;  // 페이지별 네비게이션 바 타입
  hideTopNav: string[];                      // 상단 네비게이션 바를 숨길 페이지 목록
  hideBottomNav: string[];                   // 하단 네비게이션 바를 숨길 페이지 목록
  defaultTitles: Record<string, string>;     // 페이지별 기본 타이틀
  publicPages: string[];                     // 인증이 필요없는 페이지 목록
  requiresAuth: string[];                    // 인증이 필요한 페이지 목록
}

/**
 * 실제 경로를 패턴 경로로 변환하는 함수
 * 예: /jobList/123 → /jobList/[boardId]
 * 패턴 매칭을 통해 동적 경로를 정규화하여 처리
 */
const matchDynamicRoute = (pathname: string): string => {
  const patterns = [
    { regex: /^\/jobList\/\d+$/, replacement: "/jobList/[boardId]" },
    { regex: /^\/communityBoard\/\d+$/, replacement: "/communityBoard/[boardId]" },
    { regex: /^\/jobList\/\d+\/edit$/, replacement: "/jobList/[boardId]/edit" },
    { regex: /^\/communityBoard\/\d+\/edit$/, replacement: "/communityBoard/[boardId]/edit" },
    { regex: /^\/jobList\/\d+\/map$/, replacement: "/jobList/[boardId]/map" },
    { regex: /^\/chatList$/, replacement: "/chatList" },
    { regex: /^\/chatList\/chatRoom$/, replacement: "/chatList/chatRoom" },
  ];

  // 패턴과 일치하는 경우 해당 패턴의 대체 문자열 반환
  for (const { regex, replacement } of patterns) {
    if (regex.test(pathname)) {
      return replacement;
    }
  }

  // 일치하는 패턴이 없으면 원래 경로 반환
  return pathname;
};

/**
 * 실제 경로가 패턴과 일치하는지 확인하는 함수
 * 동적 라우팅을 위한 유틸리티 함수
 * 예: /jobList/123/map이 /jobList/[boardId]/map 패턴과 일치하는지 확인
 */
const isPathMatchingPattern = (actualPath: string, patternPath: string): boolean => {
  // 정확히 일치하는 경우
  if (actualPath === patternPath) return true;
  
  // 동적 경로 패턴 매칭 ([boardId]를 숫자로 치환하여 정규식 생성)
  if (patternPath.includes('[boardId]')) {
    const basePattern = patternPath.replace('[boardId]', '\\d+');
    const regex = new RegExp(`^${basePattern}$`);
    return regex.test(actualPath);
  }
  
  return false;
};

// 네비게이션 설정 객체
const navigationConfig: NavigationConfig = {
  // 페이지별 네비게이션 바 타입 설정
  navType: {
    "/jobList/[boardId]": "onlyBack",              // 구인/중고 상세 - 뒤로가기만
    "/chatList/[chatId]": "onlyBack",              // 채팅 상세 - 뒤로가기만
    "/communityBoard/[boardId]": "onlyBack",       // 커뮤니티 상세 - 뒤로가기만
    "/jobList/[boardId]/map": "onlyBack",          // 지도 - 뒤로가기만
    "/jobList": "onlyTitle",                       // 구인/중고 목록 - 타이틀만
    "/chatList": "onlyTitle",                      // 채팅 목록 - 타이틀만
    "/communityBoard": "onlyTitle",                // 커뮤니티 목록 - 타이틀만
    "/": "onlyTitle",                              // 홈 - 타이틀만
    "/bookmark": "onlyTitle",                      // 북마크 - 타이틀만
    "/mypage": "onlyTitle",                        // 마이페이지 - 타이틀만
    "/jobList/[boardId]/edit": "onlyBack",         // 구인/중고 수정 - 뒤로가기만
    "/communityBoard/[boardId]/edit": "onlyBack",  // 커뮤니티 수정 - 뒤로가기만
  },

  // 인증이 필요한 페이지 목록
  requiresAuth: [
    "/mypage",
    "/bookmark",
    "/jobList/new",
    "/jobList/[boardId]/edit",
    "/communityBoard",
    "/jobList",
    "/communityBoard/[boardId]/edit",
    "/chatList",
    "/chatList/chatRoom",
  ],

  // 인증이 필요없는 공개 페이지 목록
  publicPages: ["/login", "/signup", "/"],

  // 상단 네비게이션 바를 숨길 페이지 목록
  hideTopNav: ["/login"],

  // 하단 네비게이션 바를 숨길 페이지 목록
  hideBottomNav: [
    "/login",
    "/signup",
    "/mypage/edit",
    "/jobList/[boardId]",
    "/jobList/new",
    "/chatList/[chatId]",
    "/communityBoard/[boardId]",
    "/map",
    "/jobList/[boardId]/map",
    "/jobList/[boardId]/edit",
    "/communityBoard/[boardId]/edit",
    "/chatList/chatRoom",
  ],

  // 페이지별 기본 타이틀 설정
  defaultTitles: {
    "/": "홈",
    "/signup": "회원가입",
    "/mypage": "마이페이지",
    "/chatList": "채팅목록",
    "/bookmark": "관심내역",
    "/jobList": "구인/중고 게시판",
    "/jobList/new": "게시물 작성",
    "/mypage/edit": "회원정보 수정",
    "/communityBoard": "커뮤니티",
    "/jobList/[boardId]/edit": "게시물 수정",
    "/communityBoard/[boardId]/edit": "커뮤니티 게시물 수정",
    "/chatList/chatRoom": "채팅방",
    "/jobList/[boardId]/map": "지도",
  },
};

interface NavigationWrapperProps {
  children: React.ReactNode;
}

/**
 * 수정 페이지 URL에서 게시글 정보를 추출하는 함수
 * boardId와 게시글 유형(trade/community)을 추출
 */
const extractBoardInfoFromEditPage = (pathname: string) => {
  const pathParts = pathname.split("/");
  const boardId = pathParts[2];
  const type = pathname.includes("jobList") ? "trade" : "community";
  return { boardId, type };
};

/**
 * 채팅방 정보를 추출하는 함수
 * 채팅방 타입과 경로를 반환
 */
const extractChatRoomInfo = (pathname: string) => {
  return { 
    type: 'chat' as const,
    path: pathname
  };
};

export default function NavigationWrapper({
  children,
}: NavigationWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [pageTitle, setPageTitle] = useState<string>("");
  const currentUser = useUserStore((state) => state.user);

  /**
   * 경로 변경 추적 로직
   * 페이지 이동 시 이전/현재 경로 저장 및 수정 페이지 플래그 관리
   */
  useEffect(() => {
    // 이전 경로를 저장하고 현재 경로를 업데이트
    navigationHistory.prevPath = navigationHistory.currentPath;
    navigationHistory.currentPath = pathname;
  
    // 수정 페이지에서 다른 페이지로 이동할 때 플래그 설정
    if (navigationHistory.prevPath.includes('/edit') && !pathname.includes('/edit')) {
      navigationHistory.isFromEditPage = true;
    } 
    // 상세 페이지에서 다른 페이지로 이동하거나 다시 수정 페이지로 갈 때 플래그 리셋
    // 참고: 실제 경로에는 '[boardId]'가 아닌 실제 ID가 있으므로 패턴 매칭 사용
    else if (
      (!(/^\/jobList\/\d+$/.test(pathname)) && 
       !(/^\/communityBoard\/\d+$/.test(pathname))) || 
      pathname.includes('/edit')
    ) {
      navigationHistory.isFromEditPage = false;
    }
  
    console.log("[NavWrapper] 네비게이션 히스토리 업데이트:", {
      prevPath: navigationHistory.prevPath,
      currentPath: navigationHistory.currentPath,
      isFromEditPage: navigationHistory.isFromEditPage
    });
  }, [pathname]);

  /**
   * 페이지 타이틀 설정 로직
   * 일반 페이지는 기본 타이틀 사용, 채팅방은 API에서 상대방 정보 조회하여 동적 타이틀 생성
   */
  useEffect(() => {
    let isMounted = true;
  
    const setTitle = async () => {
      try {
        const currentRoute = matchDynamicRoute(pathname);
  
        // 채팅방 페이지 특수 처리 - 사용자 정보 기반 동적 타이틀
        if (currentRoute === "/chatList/chatRoom") {
          const token = TokenStorage.getAccessToken();
          
          // URL 파라미터 안전하게 추출
          const roomId = searchParams.get('roomId')?.trim();
          const tradeUserId = searchParams.get('tradeUserId')?.trim();
  
          // 디버깅용 로그
          console.log("[NavWrapper] 채팅방 파라미터 분석", {
            roomId,
            tradeUserId,
            currentUserId: currentUser?.id
          });
  
          // 새로 생성된 채팅방 처리 로직
          if (roomId === 'success' && currentUser) {
            try {
              const response = await fetch('/api/trade/my-chat-rooms', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
  
              if (!response.ok) {
                throw new Error('채팅방 목록 조회 실패');
              }
  
              const chatRooms = await response.json();
              const latestChat = chatRooms[0];
              
              // 최신 채팅방이 있는 경우 상대방 이름으로 타이틀 설정
              if (latestChat) {
                const isCurrentUserRequestUser = currentUser.id === latestChat.requestUserId;
                const partnerName = isCurrentUserRequestUser 
                  ? latestChat.writeUserName 
                  : latestChat.requestUserName;
                
                if (isMounted && partnerName) {
                  setPageTitle(`${partnerName}님과의 채팅`);
                } else {
                  setPageTitle('새로운 채팅');
                }
                
                return;
              } else {
                if (isMounted) {
                  setPageTitle('새로운 채팅');
                }
                return;
              }
            } catch (error) {
              console.error("[NavWrapper] 채팅방 목록 조회 실패:", error);
              if (isMounted) {
                setPageTitle('새로운 채팅');
              }
              return;
            }
          }
  
          // 기존 채팅방 정보 조회 로직
          if (!token || !roomId) {
            console.warn("[NavWrapper] 필수 정보 부족");
            if (isMounted) {
              setPageTitle("채팅방");
            }
            return;
          }
  
          try {
            // 채팅방 상세 정보 조회 API 호출
            const response = await fetch(`/api/trade/chat-rooms/${roomId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
  
            // API 호출 실패 시 대체 처리
            if (!response.ok) {
              // URL의 tradeUserId를 활용한 대체 로직
              if (tradeUserId && currentUser) {
                const isCurrentUserRequestUser = currentUser.id !== Number(tradeUserId);
                const partnerName = isCurrentUserRequestUser 
                  ? await fetchUserNameById(Number(tradeUserId), token)
                  : currentUser.name;
  
                if (isMounted && partnerName) {
                  setPageTitle(`${partnerName}님과의 채팅`);
                } else {
                  setPageTitle('채팅방');
                }
                return;
              }
  
              throw new Error(`채팅방 정보 조회 실패: ${response.status}`);
            }
  
            const chatData = await response.json();
            
            // 채팅 상대방 이름 추출 및 타이틀 설정
            if (chatData && isMounted && currentUser) {
              const isCurrentUserRequestUser = currentUser.id === chatData.requestUserId;
              const partnerName = isCurrentUserRequestUser 
                ? chatData.writeUserName 
                : chatData.requestUserName;
              
              if (partnerName) {
                setPageTitle(`${partnerName}님과의 채팅`);
              } else {
                setPageTitle('채팅방');
              }
            }
          } catch (apiError) {
            console.error("[NavWrapper] 채팅방 정보 조회 중 오류:", apiError);
            if (isMounted) {
              setPageTitle('채팅방');
            }
          }
        } else {
          // 일반 페이지는 설정된 기본 타이틀 사용
          if (isMounted) {
            setPageTitle(navigationConfig.defaultTitles[currentRoute] || "");
          }
        }
      } catch (error) {
        console.error("[NavWrapper] 타이틀 설정 중 전역 에러:", error);
        if (isMounted) {
          setPageTitle("채팅방");
        }
      }
    };
  
    /**
     * 사용자 ID로 이름을 조회하는 헬퍼 함수
     * 채팅방 상대방 이름을 API에서 동적으로 가져옴
     */
    const fetchUserNameById = async (userId: number, token: string): Promise<string> => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('사용자 정보 조회 실패');
        }
  
        const userData = await response.json();
        return userData.name || '알 수 없는 사용자';
      } catch (error) {
        console.error("[NavWrapper] 사용자 정보 조회 실패:", error);
        return '알 수 없는 사용자';
      }
    };
  
    setTitle();
  
    // 컴포넌트 언마운트 시 클린업
    return () => {
      isMounted = false;
    };
  }, [pathname, searchParams, currentUser]);

  // 동적 경로 패턴 매칭을 통한 현재 페이지 정규화
  const matchedRoute = matchDynamicRoute(pathname);
  
  // 동적 라우트 패턴 매칭을 이용한 UI 요소 표시 여부 결정
  const showTopNav = !navigationConfig.hideTopNav.some(pattern => 
    isPathMatchingPattern(pathname, pattern)
  );
  
  const showBottomNav = !navigationConfig.hideBottomNav.some(pattern => 
    isPathMatchingPattern(pathname, pattern)
  );
  
  const requireAuth = navigationConfig.requiresAuth.some(pattern => 
    isPathMatchingPattern(pathname, pattern)
  );

  // 페이지별 리소스 데이터 추출 (인증 및 권한 검사용)
  const pageResource = pathname.includes("/edit")
    ? {
        boardId: extractBoardInfoFromEditPage(pathname).boardId,
        type: extractBoardInfoFromEditPage(pathname).type as "trade" | "community",
        userId: undefined,
      }
    : pathname === "/chatList/chatRoom"
    ? extractChatRoomInfo(pathname)
    : undefined;

  // 인증이 필요한 페이지는 AuthGuard로 보호
  const wrappedContent = requireAuth ? (
    <AuthGuard
      requireAuth={true}
      redirectTo="/login"
      resource={pageResource}
      loadingComponent={
        <div className="flex justify-center items-center h-screen">
          로딩중...
        </div>
      }
    >
      {children}
    </AuthGuard>
  ) : (
    children
  );

  // 최종 레이아웃 렌더링 - 상단/하단 네비게이션 바와 메인 콘텐츠
  return (
    <div
      className={`min-h-screen ${showTopNav ? "pt-12" : ""} ${
        showBottomNav ? "pb-24" : ""
      }`}
    >
      {showTopNav && (
        <TopNavBar
          title={pageTitle}
          type={navigationConfig.navType[matchedRoute] || "default"}
        />
      )}
      {wrappedContent}
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}