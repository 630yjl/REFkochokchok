// src/components/auth/utils/tokenUtils.ts

/**
 * JWT 토큰 관리 유틸리티
 * 
  * @description
 * 클라이언트 사이드에서 JWT 토큰을 안전하고 효율적으로 관리하기 위한 종합 유틸리티
 * 
* 주요 기능:
 * 1. 로컬 스토리지 기반 토큰 관리
 * 2. 토큰 만료 자동 감지 및 갱신
 * 3. 보안 강화를 위한 상세 로깅
 * 4. 토큰 갱신 시도 제한
 * 5. 사용자 인증 상태 종합 관리
 * 
 * 보안 설계 원칙:
 * - 최소 권한 원칙
 * - 안전한 토큰 저장
 * - 상세한 보안 이벤트 추적
 * 
 * @description
 * - 토큰 갱신 프로세스의 안전성과 투명성 확보
 * - 상세한 로깅을 통한 토큰 관리 모니터링
 * - 실패 및 성공 시도에 대한 포괄적인 추적
 */

import {
  AuthResponse,
  AuthCheckResult,
  TokenData,
  TokenRefreshState,
  SecurityEventDetails,
} from "@/components/auth/types/auth";
import { useUserStore } from "@/commons/store/userStore";

// 토큰 갱신 설정 상수 - 보안 및 성능 제어
const TOKEN_REFRESH_CONFIG = {
  MAX_ATTEMPTS: 3,             // 최대 토큰 갱신 시도 횟수 (무한 재시도 방지)
  RESET_INTERVAL: 5 * 60 * 1000 // 갱신 시도 횟수 초기화 간격 (5분)
};

/**
 * 토큰의 남은 시간을 사람이 읽기 쉬운 형식으로 계산
 * 
 * @param token JWT 토큰
 * @returns 남은 시간 문자열 (예: "10분 30초")
 * @throws 토큰 파싱 중 오류 발생 시 "알 수 없음" 반환
 */
const calculateRemainingTokenTime = (token: string): string => {
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    const expTimeSeconds = payload.exp;
    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = expTimeSeconds - currentTimeSeconds;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}분 ${seconds}초`;
  } catch (error) {
    console.error("[Token] 토큰 시간 계산 실패:", error);
    return "알 수 없음";
  }
};

// 토큰 갱신 상태 추적을 위한 상태 객체
const tokenRefreshState: TokenRefreshState = {
  lastAttemptTime: 0,          // 마지막 갱신 시도 시간
  failedAttempts: 0,           // 갱신 실패 횟수
  successAttempts: 0,          // 갱신 성공 횟수
  lastSuccessTokenInfo: undefined // 마지막 성공적인 토큰 갱신 정보
};

/**
 * 보안 관련 이벤트를 로깅하는 함수
 * 
 * @param eventType 보안 이벤트 유형
 * @param details 이벤트 상세 정보
 * @description 
 * - 모든 보안 관련 이벤트를 콘솔에 기록
 * - 중요한 보안 이벤트는 경고 레벨로 로깅
 */
const logSecurityEvent = (eventType: string, details: SecurityEventDetails) => {
  const logData = {
    type: eventType,
    ...details,
  };

  console.log("[Token Security Event]", logData);
// 심각한 보안 이벤트에 대해 경고 로깅
  if (
    eventType.includes("TOKEN_REFRESH_LIMIT_EXCEEDED") ||
    eventType.includes("TOKEN_REFRESH_FAILED") ||
    eventType.includes("TOKEN_REFRESH_ERROR")
  ) {
    console.warn("⚠️ Token Security Warning:", logData);
  }
};

/**
 * 테스트 및 개발 환경을 위한 만료 토큰 생성 함수
 *
 * @param originalToken 원본 토큰
 * @returns 만료된 상태의 토큰
 */
export const createExpiredToken = (originalToken: string): string => {
  try {
    const tokenParts = originalToken.split(".");
    const payload = JSON.parse(atob(tokenParts[1]));
    payload.exp = Math.floor(Date.now() / 1000) - 60 * 5;
    const modifiedPayloadBase64 = btoa(JSON.stringify(payload));
    return `${tokenParts[0]}.${modifiedPayloadBase64}.${tokenParts[2]}`;
  } catch (error) {
    console.error("[Token] 만료 토큰 생성 실패:", error);
    return originalToken;
  }
};

// 토큰 저장소 관리 객체 - 로컬 스토리지 기반 토큰 관리
export const TokenStorage = {
  /**
   * 토큰을 로컬 스토리지에 안전하게 저장
   * 
   * @param tokens 액세스 및 리프레시 토큰
   * @throws 토큰 저장 중 오류 발생 시 예외 처리
   */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
    try {
      const tokenData: TokenData = {
        ...tokens,
        timestamp: new Date().getTime(), // 저장 시간 기록
      };

      localStorage.setItem("token-storage", JSON.stringify(tokenData));

      console.log("[TokenStorage] 토큰 저장 완료:", {
        storedAt: new Date().toISOString(),
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length,
      });
    } catch (error) {
      console.error("[TokenStorage] 토큰 저장 실패:", error);
      throw new Error("토큰 저장 중 오류가 발생했습니다.");
    }
  },

  /**
   * 저장된 토큰 정보 조회
   *
   * @returns 저장된 토큰 데이터 또는 null
   */
  getTokens: (): TokenData | null => {
    try {
      const tokens = localStorage.getItem("token-storage");
      const parsedTokens = tokens ? JSON.parse(tokens) : null;

      if (parsedTokens) {
        console.log("[TokenStorage] 토큰 조회 성공:", {
          hasAccessToken: !!parsedTokens.accessToken,
          hasRefreshToken: !!parsedTokens.refreshToken,
          timestamp: new Date(parsedTokens.timestamp).toISOString(),
        });
      } else {
        console.log("[TokenStorage] 저장된 토큰 없음");
      }

      return parsedTokens;
    } catch (error) {
      console.error("[TokenStorage] 토큰 가져오기 실패:", error);
      return null;
    }
  },

  /**
   * 액세스 토큰 단독 조회
   *
   * @returns 액세스 토큰 또는 null
   */
  getAccessToken: (): string | null => {
    const tokens = TokenStorage.getTokens();
    if (tokens?.accessToken) {
      console.log("[TokenStorage] AccessToken 조회 성공");
      return tokens.accessToken;
    }
    console.log("[TokenStorage] AccessToken 없음");
    return null;
  },

  /**
   * 모든 토큰 정보 삭제
   */
  clearTokens: () => {
    try {
      localStorage.removeItem("token-storage");
      console.log("[TokenStorage] 토큰 삭제 완료");
    } catch (error) {
      console.error("[TokenStorage] 토큰 삭제 실패:", error);
      throw new Error("토큰 삭제 중 오류가 발생했습니다.");
    }
  },

  /**
   * 토큰 만료 여부 확인
   *
   * @returns 토큰 만료 상태 (true: 만료, false: 유효)
   */
  isTokenExpired: (): boolean => {
    try {
      const tokens = TokenStorage.getTokens();
      if (!tokens?.accessToken) {
        console.log("[Token] 토큰 없음");
        return true;
      }

      const parts = tokens.accessToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      const expTimeSeconds = payload.exp;
      const currentTimeSeconds = Math.floor(Date.now() / 1000);
      const remainingSeconds = expTimeSeconds - currentTimeSeconds;

      console.log("[Token] 만료 상태 확인:", {
        현재시간: new Date(currentTimeSeconds * 1000).toISOString(),
        만료시간: new Date(expTimeSeconds * 1000).toISOString(),
        남은시간: `${Math.floor(remainingSeconds / 60)}분 ${remainingSeconds % 60}초`,
        상태: remainingSeconds <= 0 ? '만료됨' : 
              remainingSeconds <= 300 ? '만료 임박' : '유효함',
        상세정보: {
          현재타임스탬프: currentTimeSeconds,
          만료타임스탬프: expTimeSeconds,
          남은초: remainingSeconds
        }
      });

      return remainingSeconds <= 0;
    } catch (error) {
      console.error("[Token] 토큰 만료 체크 실패:", error);
      return true;
    }
  },
};

/**
 * 액세스 토큰 자동 갱신 함수
 * 
 * @returns 새로 발급된 액세스 토큰 또는 null
 * @description
 * - 토큰 갱신 최대 시도 횟수 제한
 * - 보안 이벤트 로깅
 * - 실패 시 로그인 페이지로 리다이렉트
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const currentTime = Date.now();
 
  // 최대 갱신 시도 횟수 초과 시 보안 처리
  if (tokenRefreshState.failedAttempts >= TOKEN_REFRESH_CONFIG.MAX_ATTEMPTS) {
    console.warn('[Token] 토큰 갱신 최대 실패 횟수 초과');
    
    logSecurityEvent("TOKEN_REFRESH_LIMIT_EXCEEDED", {
      message: "토큰 갱신 최대 실패 횟수 초과",
      timestamp: new Date(currentTime).toISOString(),
    });
 
    TokenStorage.clearTokens(); // 토큰 초기화
    window.location.href = '/login'; // 로그인 페이지로 리다이렉트
    return null;
  }
 
  try {
    const tokens = TokenStorage.getTokens();
    if (!tokens?.refreshToken) {
      console.log("[Token] RefreshToken 없음");
      
      tokenRefreshState.failedAttempts++;
      tokenRefreshState.lastAttemptTime = currentTime;
      
      return null;
    }
 
    // 토큰 갱신 API 요청
    const response = await fetch(
      `/api/users/refresh-token?refreshToken=${tokens.refreshToken}`,
      {
        method: "GET",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
 
    // 토큰 갱신 실패 처리
    if (!response.ok) {
      console.error("[Token] 토큰 갱신 실패");
      
      tokenRefreshState.failedAttempts++;
      tokenRefreshState.lastAttemptTime = currentTime;
      
      logSecurityEvent("TOKEN_REFRESH_FAILED", {
        responseStatus: response.status,
        timestamp: new Date(currentTime).toISOString(),
      });
      
      return null;
    }
 
    // 토큰 갱신 성공 처리
    const newAccessToken = await response.text();
    
    // 성공 이력 추적 및 로깅
    tokenRefreshState.successAttempts++;
    tokenRefreshState.lastSuccessTokenInfo = {
      timestamp: new Date(currentTime).toISOString()
    };
    
    console.log('🔓 새로운 토큰으로 갱신 성공!', {
      메시지: '보안 토큰이 성공적으로 재발급되었습니다.',
      토큰_상세_정보: {
        총_성공_횟수: tokenRefreshState.successAttempts,
        마지막_갱신_시간: tokenRefreshState.lastSuccessTokenInfo.timestamp,
        갱신한_토큰의_남은_시간: calculateRemainingTokenTime(newAccessToken)
      }
    });
 
    // 실패 횟수 초기화
    tokenRefreshState.failedAttempts = 0;
    tokenRefreshState.lastAttemptTime = currentTime;
 
    TokenStorage.setTokens({
      accessToken: newAccessToken,
      refreshToken: tokens.refreshToken,
    });
 
    return newAccessToken;
  } catch (error) {
    console.error("[Token] 토큰 갱신 중 에러");
    
    tokenRefreshState.failedAttempts++;
    tokenRefreshState.lastAttemptTime = currentTime;
    
    logSecurityEvent("TOKEN_REFRESH_ERROR", {
      errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
      timestamp: new Date(currentTime).toISOString(),
    });
    
    return null;
  }
};

/**
 * 토큰에서 사용자 ID 추출
 *
 * @param token JWT 토큰
 * @returns 사용자 ID 또는 null
 */
export const extractUserIdFromToken = (token: string): number | null => {
  try {
    const tokenParts = token.split(".");
    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.sub ? Number(payload.sub) : null;
  } catch (error) {
    console.error("[TokenUtils] 토큰 파싱 실패:", error);
    return null;
  }
};

/**
 * 사용자 인증 상태 확인
 *
 * @returns 인증 상태 정보
 */
export const checkAuthStatus = async (): Promise<AuthCheckResult> => {
  try {
    const tokens = TokenStorage.getTokens();
    console.log(
      "[AuthCheck] 토큰 확인:",
      tokens?.accessToken ? "존재" : "없음"
    );

    if (tokens?.accessToken && TokenStorage.isTokenExpired()) {
      console.log("[AuthCheck] 토큰 만료됨, 갱신 시도");
      const newToken = await refreshAccessToken();
      if (newToken) {
        return {
          isAuthenticated: true,
          isAuthorized: true,
        };
      }
    }

    const isAuthenticated =
      !!tokens?.accessToken && !TokenStorage.isTokenExpired();

    const store = useUserStore.getState();
    console.log("[AuthCheck] Store 상태:", {
      hasUser: !!store.user,
      timestamp: new Date().toISOString(),
    });

    return {
      isAuthenticated,
      isAuthorized: isAuthenticated,
      message: isAuthenticated ? undefined : "로그인이 필요합니다",
    };
  } catch (error) {
    console.error("[AuthCheck] 인증 상태 확인 실패:", error);
    return {
      isAuthenticated: false,
      isAuthorized: false,
      message: "인증 확인 중 오류 발생",
    };
  }
};

/**
 * 인증된 API 요청 함수
 *
 * @param url API 엔드포인트
 * @param options 요청 옵션
 * @param retryCount 토큰 갱신 재시도 횟수
 * @returns API 응답
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  retryCount = 1
): Promise<Response> => {
  try {
    const token = TokenStorage.getAccessToken();
    if (!token) {
      console.log("[Auth] 토큰 없음");
      throw new Error("인증이 필요합니다");
    }

    // 토큰 사용 로깅 추가
    console.log("[Auth] 토큰 사용 로그", {
      url,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    if (TokenStorage.isTokenExpired()) {
      console.log("[Auth] 토큰 만료됨, 갱신 시도");
      const newToken = await refreshAccessToken();
      if (!newToken) {
        window.location.href = "/login";
        throw new Error("세션이 만료되었습니다.");
      }
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TokenStorage.getAccessToken()}`,
      ...options.headers,
    };

    const response = await fetch(`${url}`, {
      ...options,
      headers,
    });

    console.log("[Auth] API 응답:", {
      url,
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString(),
    });

if (response.status === 401 && retryCount > 0) {
  console.log("[Auth] 401 응답, 토큰 갱신 후 재시도");
  const newToken = await refreshAccessToken();

  if (newToken) {
    return authenticatedFetch(url, options, retryCount - 1);
  } else {
    window.location.href = "/login";
    throw new Error("세션이 만료되었습니다.");
  }
}

return response;
} catch (error) {
console.error("[Auth] Request failed:", error);
throw error;
}
};

/**
* 인증 응답 처리 함수
*
* @param response 인증 응답 데이터
* @returns 추출된 사용자 ID 또는 null
*/
export const handleAuthResponse = (response: AuthResponse) => {
try {
if (response.accessToken) {
  TokenStorage.setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return extractUserIdFromToken(response.accessToken);
}
return null;
} catch (error) {
console.error("[Auth] 응답 처리 실패:", error);
return null;
}
};