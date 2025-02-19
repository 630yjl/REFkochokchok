// src/components/auth/components/AuthGuard.tsx

/**
 * AuthGuard 컴포넌트
 *
 * 주요 기능:
 * 1. 애플리케이션 전체 페이지의 통합 보안 접근 제어
 * 2. 사용자 인증 및 권한 실시간 검증 메커니즘
 * 3. 리소스 유형별 세분화된 접근 권한 관리
 *    - 게시글 수정/조회 권한
 *    - 채팅방 접근 권한
 *    - 프로필 접근 권한
 * 4. 보안 취약점 방어 및 비정상적 접근 추적
 *
 * 보안 핵심 전략:
 * - JWT 토큰 기반 인증
 * - 사용자 역할 및 권한의 다층적 검증
 * - 민감한 리소스에 대한 엄격한 접근 제한
 * - 비인가 접근 시도에 대한 comprehensive 로깅
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/commons/store/userStore";
import {
  checkAuthStatus,
  TokenStorage,
} from "@/components/auth/utils/tokenUtils";
import { toast } from "react-hot-toast";
import { SecurityEventDetails, ChatRoom, AuthGuardProps } from "../types/auth";

/**
 * 보안 이벤트 로깅 함수
 * 현재는 콘솔에만 로깅하도록 구현
 * 
 * @param eventType - 발생한 보안 이벤트의 유형
 * @param details - 이벤트와 관련된 상세 정보
 */
const logSecurityEvent = (eventType: string, details: SecurityEventDetails) => {
  // 기본 로그 데이터 구성
  const logData = {
    type: eventType,
    ...details,
  };

  // 일반 로그
  console.log('[Security Event]', logData);
  
  // 보안 관련 중요 이벤트는 경고 레벨로 로깅
  if (eventType.includes('UNAUTHORIZED') || eventType.includes('ERROR')) {
    console.warn('⚠️ Security Warning:', logData);
  }
};

export const AuthGuard = ({
  children,
  resource,
  requireAuth = true,
  fallback,
  redirectTo = "/login",
  loadingComponent = <div>Loading...</div>,
}: AuthGuardProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        // 1. 인증 불필요한 페이지 사전 처리
        if (!requireAuth) {
          if (isMounted) {
            setIsAuthorized(true);
            setIsLoading(false);
          }
          return;
        }

        // 2. 사용자 인증 상태 검증
        const authResult = await checkAuthStatus();
        if (!authResult.isAuthenticated) {
          if (isMounted) {
            setIsLoading(false);
            router.push(redirectTo);
          }
          return;
        }

        // 3. 채팅방 전용 권한 체크 메커니즘
        if (resource?.type === "chat" && resource?.boardId) {
          try {
            const token = TokenStorage.getAccessToken();
            if (!token) {
              throw new Error("인증 토큰 없음");
            }

            // 채팅방 정보 조회 API 호출
            const response = await fetch(
              `/api/trade/${resource.boardId}/chat-rooms`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              throw new Error("채팅방 정보 조회 실패");
            }

            const chatRooms = await response.json();

            // chatRooms.some 부분 수정 - 채팅방 접근 권한 검증
            const isAuthorizedUser = chatRooms.some(
              (room: ChatRoom) =>
                // 현재 사용자가 채팅방 작성자이거나 요청자인 경우 접근 허용
                room.writeUserId === user?.id || room.requestUserId === user?.id
            );

            if (!isAuthorizedUser) {
              // 비인가 채팅방 접근 시도에 대한 상세 보안 로깅
              await logSecurityEvent("UNAUTHORIZED_CHAT_ACCESS", {
                userId: user?.id,
                attemptedBoardId: resource.boardId,
                timestamp: new Date().toISOString(),
              });

              // 사용자 경험을 고려한 토스트 알림
              toast.error(
                "채팅방 접근 권한이 없습니다.\n해당 게시물 상세 페이지로 이동합니다.",
                {
                  duration: 3000,
                  position: "top-center",
                }
              );

              // 해당 게시물 상세 페이지로 리다이렉트
              router.push(`/jobList/${resource.boardId}`);
              return;
            }

            // 채팅방 접근 권한 최종 승인
            if (isMounted) {
              setIsAuthorized(true);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("[AuthGuard] 채팅방 권한 체크 실패:", error);

            // 에러 발생 시 상세 보안 로깅
            await logSecurityEvent("CHAT_ACCESS_ERROR", {
              userId: user?.id,
              errorMessage:
                error instanceof Error ? error.message : "알 수 없는 오류",
              timestamp: new Date().toISOString(),
            });

            // 안전한 기본 리다이렉트
            router.push("/jobList");
          }
          return;
        }

        // 4. 기존 게시글 수정/조회 권한 체크 메커니즘
        if (resource?.boardId && resource?.type) {
          try {
            const token = TokenStorage.getAccessToken();
            if (!token) {
              console.log("[AuthGuard] 토큰 없음");
              if (isMounted) {
                setIsLoading(false);
                router.push(redirectTo);
              }
              return;
            }

            // API 경로 동적 결정
            const apiPath =
              resource.type === "trade"
                ? `/api/trade/${resource.boardId}`
                : `/api/community/${resource.boardId}`;

            // 게시글 정보 조회
            const response = await fetch(apiPath, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              console.log("[AuthGuard] 게시글 조회 실패");
              if (isMounted) {
                setIsLoading(false);
                router.push(
                  resource.type === "trade" ? "/jobList" : "/communityBoard"
                );
              }
              return;
            }

            const responseData = await response.json();

            // 여기에 로그 추가
            console.log("[AuthGuard] 권한 체크:", {
              userId: user?.id,
              writeUserId: responseData?.writeUserId,
              isMatch: user?.id === responseData?.writeUserId,
            });

            // 게시글 작성자 권한 최종 검증
            if (!responseData || user?.id !== responseData.writeUserId) {
              console.log("[AuthGuard] 게시글 수정 권한 없음");
              if (isMounted) {
                toast.error(
                  "게시글 수정 권한이 없습니다.\n작성자만 수정이 가능합니다.",
                  {
                    duration: 3000,
                    position: "top-center",
                  }
                );
                setIsLoading(false);
                router.push(
                  resource.type === "trade" ? "/jobList" : "/communityBoard"
                );
              }
              return;
            }

            // 권한 승인
            if (isMounted) {
              setIsAuthorized(true);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("[AuthGuard] 게시글 권한 체크 실패:", error);
            if (isMounted) {
              setIsLoading(false);
              router.push(
                resource.type === "trade" ? "/jobList" : "/communityBoard"
              );
            }
          }
          return;
        }

        // 5. 기본 리소스 권한 체크
        if (resource && resource.userId) {
          const hasResourceAccess = user?.id === Number(resource.userId);
          console.log("[AuthGuard] 리소스 접근 권한 체크:", {
            userId: user?.id,
            resourceUserId: resource.userId,
            hasAccess: hasResourceAccess,
          });

          if (!hasResourceAccess) {
            console.log("[AuthGuard] 리소스 접근 권한 없음");
            if (isMounted) {
              setIsAuthorized(false);
              setIsLoading(false);
              if (!fallback) {
                router.push("/");
              }
            }
            return;
          }
        }

        // 6. 모든 검증 조건 통과
        if (isMounted) {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[AuthGuard] 인증 체크 중 에러:", error);
        if (isMounted) {
          setIsLoading(false);
          setIsAuthorized(false);
          router.push(redirectTo);
        }
      }
    };

    verifyAuth();

    // 컴포넌트 언마운트 시 상태 정리
    return () => {
      isMounted = false;
    };
  }, [requireAuth, redirectTo, resource, router, user?.id, fallback]);

  // 로딩 상태 렌더링
  if (isLoading) {
    return loadingComponent;
  }

  // 권한 체크 실패 시 폴백 컴포넌트 렌더링
  if (requireAuth && !isAuthorized) {
    return fallback || null;
  }

  // 모든 권한 검증 통과 시 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default AuthGuard;
