// src/components/auth/components/AuthProvider.tsx
"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";
import { TokenStorage } from "../utils/tokenUtils";
import { useUserStore } from "@/commons/store/userStore";
import { 
  CommunityResponseData,
  CachedBoardData,
  BoardApiResponse,
  AuthProviderProps 
} from "../types/auth";



// 권한 필요 경로 패턴 - 정확한 URL 매칭을 위해 수정
const PROTECTED_PATHS = {
  EDIT_TRADE: /^\/jobList\/\d+\/edit$/, // 구인/중고 게시글 수정
  EDIT_COMMUNITY: /^\/communityBoard\/\d+\/edit$/, // 커뮤니티 게시글 수정
  USER_PROFILE: /^\/mypage\/.*$/ // 사용자 프로필
};

const CACHE_DURATION = 5 * 60 * 1000; // 5분

const AuthProvider = ({ children }: AuthProviderProps) => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const boardCache = useRef<Map<string, CachedBoardData>>(new Map());

  // 구인/중고 게시글 데이터 조회
  const fetchTradeData = useCallback(async (boardId: string): Promise<BoardApiResponse> => {
    try {
      // 캐시 확인
      const cached = boardCache.current.get(boardId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        console.log('[AuthProvider] 캐시된 게시글 데이터 사용:', boardId);
        return { message: "success", data: cached.data };
      }

      const tokens = TokenStorage.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      console.log('[AuthProvider] 구인/중고 게시글 데이터 요청:', {
        boardId,
        url: `/api/trade/${boardId}`
      });

      const response = await fetch(
        `/api/trade/${boardId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[AuthProvider] API 응답 상태:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '게시글 조회 실패');
      }

      const responseData: BoardApiResponse = await response.json();
      console.log('[AuthProvider] 게시글 데이터 응답:', {
        message: responseData.message,
        hasData: !!responseData.data,
        userId: responseData.data?.userId
      });
      
      if (responseData.data) {
        boardCache.current.set(boardId, {
          userId: responseData.data.userId,
          data: responseData.data,
          timestamp: now
        });
      }

      return responseData;
    } catch (error) {
      console.error('[AuthProvider] 게시글 조회 실패:', error);
      throw error;
    }
  }, []);

  // 커뮤니티 게시글 데이터 조회
  const fetchCommunityData = useCallback(async (postId: string): Promise<CommunityResponseData> => {
    try {
      const tokens = TokenStorage.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      console.log('[AuthProvider] 커뮤니티 게시글 데이터 요청:', {
        postId,
        url: `/api/community/${postId}`
      });

      const response = await fetch(
        `/api/community/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '게시글 조회 실패');
      }

      const responseData = await response.json();
      console.log('[AuthProvider] 커뮤니티 게시글 데이터 응답:', {
        hasData: !!responseData.data,
        userId: responseData.data?.userId
      });

      return responseData;
    } catch (error) {
      console.error('[AuthProvider] 커뮤니티 게시글 조회 실패:', error);
      throw error;
    }
  }, []);

  // 권한 체크 함수
  const checkResourcePermission = useCallback(async () => {
    try {
      console.log('[AuthProvider] 권한 체크 시작:', {
        pathname,
        userLoggedIn: !!user,
        userId: user?.id
      });

      // 구인/중고 게시글 수정 권한 체크
      if (PROTECTED_PATHS.EDIT_TRADE.test(pathname)) {
        const boardId = params.boardId as string;
        console.log('[AuthProvider] 구인/중고 게시글 수정 권한 체크 시작:', {
          boardId,
          userId: user?.id
        });

        const boardData = await fetchTradeData(boardId);
        if (!boardData.data) {
          throw new Error('게시글을 찾을 수 없습니다.');
        }

        const isAuthorized = user?.id === boardData.data.userId;
        console.log('[AuthProvider] 구인/중고 게시글 권한 체크 결과:', {
          userId: user?.id,
          authorId: boardData.data.userId,
          isAuthorized,
          pathname
        });

        if (!isAuthorized) {
          alert('게시글 수정 권한이 없습니다.');
          router.push('/');
          return false;
        }
      }

      // 커뮤니티 게시글 수정 권한 체크
      if (PROTECTED_PATHS.EDIT_COMMUNITY.test(pathname)) {
        const postId = params.boardId as string;
        console.log('[AuthProvider] 커뮤니티 게시글 수정 권한 체크 시작:', {
          postId,
          userId: user?.id
        });

        const communityData = await fetchCommunityData(postId);
        if (!communityData.data) {
          throw new Error('게시글을 찾을 수 없습니다.');
        }

        const isAuthorized = user?.id === communityData.data.userId;
        console.log('[AuthProvider] 커뮤니티 게시글 권한 체크 결과:', {
          userId: user?.id,
          authorId: communityData.data.userId,
          isAuthorized,
          pathname
        });

        if (!isAuthorized) {
          alert('게시글 수정 권한이 없습니다.');
          router.push('/');
          return false;
        }
      }

      // 사용자 프로필 페이지 권한 체크
      if (PROTECTED_PATHS.USER_PROFILE.test(pathname)) {
        const profileId = params.userId as string;
        console.log('[AuthProvider] 프로필 페이지 권한 체크:', {
          profileId,
          userId: user?.id,
          isAuthorized: user?.id === Number(profileId)
        });

        if (user?.id !== Number(profileId)) {
          router.push('/');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[AuthProvider] 권한 체크 실패:', error);
      router.push('/');
      return false;
    }
  }, [pathname, params, router, user, fetchTradeData, fetchCommunityData]);

  // 페이지 접근 시 권한 체크
  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      try {
        if (Object.values(PROTECTED_PATHS).some(pattern => pattern.test(pathname))) {
          console.log('[AuthProvider] 보호된 경로 접근 감지:', {
            pathname,
            hasToken: !!TokenStorage.getTokens()?.accessToken
          });
          
          const tokens = TokenStorage.getTokens();
          if (!tokens?.accessToken) {
            console.log('[AuthProvider] 토큰 없음, 로그인 페이지로 이동');
            router.push('/login');
            return;
          }

          if (isMounted) {
            await checkResourcePermission();
          }
        }
      } catch (error) {
        console.error('[AuthProvider] 접근 권한 확인 실패:', error);
        if (isMounted) {
          router.push('/');
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, checkResourcePermission, router]);

  return <>{children}</>;
};

export default AuthProvider;