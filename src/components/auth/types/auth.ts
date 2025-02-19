import { ReactNode } from "react";

/**
 * 토큰 데이터 구조 정의
 * 액세스/리프레시 토큰과 타임스탬프 저장
 */
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}

/**
 * 토큰 갱신 상태 관리를 위한 인터페이스
 * 토큰 갱신 시도 추적 및 보안 로깅에 활용
 */
export interface TokenRefreshState {
  lastAttemptTime: number;     // 마지막 갱신 시도 시간
  failedAttempts: number;      // 갱신 실패 횟수
  successAttempts: number;     // 갱신 성공 횟수
  lastSuccessTokenInfo?: {     // 마지막 성공적인 토큰 갱신 정보
    timestamp: string; 
  };
}

/**
 * 인증 응답 데이터 구조
 * 서버로부터 받는 토큰 및 메시지 정의
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

/**
 * 인증 상태 확인 결과 인터페이스
 * 사용자 인증 및 권한 상태 표현
 */
export interface AuthCheckResult {
  isAuthenticated: boolean;    // 인증 여부
  isAuthorized: boolean;       // 권한 부여 여부
  message?: string;            // 추가 메시지
}

/**
 * 보안 이벤트 상세 정보 인터페이스
 * 보안 관련 이벤트 추적 및 로깅에 활용
 */
export interface SecurityEventDetails {
  userId?: number;             // 사용자 ID
  attemptedBoardId?: string;   // 접근 시도된 게시글 ID
  timestamp: string;           // 이벤트 발생 시간
  message?: string;            // 이벤트 메시지
  errorMessage?: string;       // 에러 메시지
  responseStatus?: number;     // API 응답 상태 코드
  url?: string;                // 요청 URL
  userAgent?: string;          // 사용자 브라우저 정보
}

/**
 * AuthGuard 관련 타입
 */
export interface AuthGuardProps {
  children: ReactNode;
  resource?: {
    userId?: number;
    boardId?: string;
    type?: "trade" | "community" | "chat";
    writeUserId?: number;
    requestUserId?: number;
  };
  requireAuth?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

/**
 * 채팅방 정보 인터페이스
 * 채팅방 접근 권한 확인을 위한 기본 구조 정의
 */
export interface ChatRoom {
  /** 채팅방 작성자 ID */
  writeUserId: number;
  /** 채팅 요청자 ID */
  requestUserId: number;
  /** 채팅방 고유 식별자 */
  roomId: string;
}

/**
 * 게시글 데이터 관련 타입
 */
export interface TradeData {
  userId: number;
  title: string;
  region: string;
  price: number;
  contents: string;
  images: string[];
}

export interface CommunityData {
  userId: number;
  title: string;
  contents: string;
  images: string[];
}

export interface CommunityResponseData {
  message: string;
  data: CommunityData | null;
}

export interface CachedBoardData {
  userId: number;
  data: TradeData;
  timestamp: number;
}

export interface BoardApiResponse {
  message: string;
  data: TradeData | null;
}

/**
 * 컴포넌트 Props 타입
 */
export interface AuthProviderProps {
  children: ReactNode;
}