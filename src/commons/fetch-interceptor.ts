// src/commons/fetch-interceptor.ts
"use client";

/**
* Fetch 인터셉터 유틸리티
* 
* 주요 기능:
* 1. 모든 API 요청에 대한 전역 인터셉터 설정
* 2. JWT 토큰 기반 인증 관리
* 3. 토큰 만료 자동 갱신 
* 4. 인증 오류에 대한 사용자 알림 및 리다이렉트
* 5. 보안 강화를 위한 요청/응답 인터셉션
* 6. 클라이언트 사이드 토큰 관리
* 7. 무중단 세션 유지
* 
* @description 
* - 모든 API 요청을 중간에 가로채어 토큰 검증 및 갱신
* - 인증 실패 시 자동으로 로그인 페이지로 리다이렉트
* - 보안 및 사용자 경험 최적화
*/

import { TokenStorage, refreshAccessToken } from '../components/auth/utils/tokenUtils';
import { useUserStore } from '@/commons/store/userStore';
import toast from 'react-hot-toast';

/**
 * 인증 예외 경로 목록
 * 
 * 이 경로들은 토큰 검증 과정을 건너뛰고 바로 원본 fetch를 호출합니다.
 * 주로 인증 관련 API나 공개 데이터 조회 API가 여기에 포함됩니다.
 * 경로 패턴만 포함되어 있으면 모두 매칭됩니다(부분 문자열 매칭).
 */
const AUTH_EXEMPT_PATHS = [
  '/api/users/login',        // 로그인 API
  '/api/users/signup',       // 회원가입 API
  '/api/users/refresh-token', // 토큰 갱신 API
  '/api/users/check-email',  // 이메일 중복 체크 API
  '/api/users/check-name'    // 닉네임 중복 체크 API
];

/**
* Fetch 인터셉터 설정 함수
* 
* @description 
* - window.fetch를 오버라이딩하여 전역 인터셉터 구현
* - 모든 API 요청에 대해 토큰 검증 및 갱신 로직 적용
* - 특수 케이스(파일 업로드, 회원탈퇴 등) 특별 처리
*/
const setupInterceptor = () => {
 // 원본 fetch 메서드를 백업 - 나중에 호출하기 위함
 const originalFetch = window.fetch;

 // fetch 메서드 재정의 - 모든 fetch 호출은 이 함수를 통과함
 window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
   try {
     // URL을 문자열로 변환 (Request 객체일 수도 있음)
     const url = input.toString();
     
     // 파일 업로드 요청 감지 - FormData 객체 사용 여부로 판단
     const isFileUpload = init.body instanceof FormData;
     
     // 디버깅을 위한 상세 로그
     console.log('[FetchInterceptor] 요청 감지:', {
       url,                                       // 요청 URL
       method: init.method || 'GET',              // HTTP 메서드 (기본값: GET)
       isFileUpload,                              // 파일 업로드 여부
       bodyType: init.body ? typeof init.body : 'none', // 요청 본문 타입
       headers: init.headers                      // 요청 헤더
     });
     
     // 인증 예외 처리: 내부 API가 아니거나 인증 예외 경로인 경우
     // 1. 외부 API 호출 (/api로 시작하지 않는 URL)
     // 2. 인증이 필요 없는 내부 API (AUTH_EXEMPT_PATHS에 포함된 경로)
     if (!url.startsWith('/api') || AUTH_EXEMPT_PATHS.some(path => url.includes(path))) {
       console.log('[FetchInterceptor] 인증 제외 경로:', url);
       // 원본 fetch 함수 호출 - 인증 과정 없이 바로 요청
       return originalFetch(input, init);
     }
     
     // 회원탈퇴 요청 특별 처리 (DELETE /api/users)
     if (init.method === 'DELETE' && url === '/api/users') {
       console.log('[FetchInterceptor] 회원탈퇴 요청 감지: 특별 처리 적용');
       
       // 토큰 확인 - 회원탈퇴는 인증이 필수
       const token = TokenStorage.getAccessToken();
       if (!token) {
         console.error('[FetchInterceptor] 회원탈퇴 실패: 토큰 없음');
         toast.error('로그인이 필요합니다');
         
         // 인증 오류 응답 직접 생성하여 반환
         return new Response(JSON.stringify({ message: '인증이 필요합니다', data: null }), {
           status: 401,
           headers: { 'Content-Type': 'application/json' }
         });
       }
       
       // 회원탈퇴 요청용 옵션 구성 - Authorization 헤더 추가
       const deleteOptions = {
         ...init,
         headers: {
           'Accept': '*/*',
           'Authorization': `Bearer ${token}`,
           ...(init.headers || {})
         }
       };
       
       console.log('[FetchInterceptor] 회원탈퇴 요청 전송');
       // 특별 처리된 옵션으로 원본 fetch 호출
       return originalFetch(input, deleteOptions);
     }
     
     // 파일 업로드 요청 특별 처리
     // FormData를 사용하는 경우 Content-Type을 자동으로 설정하도록 함
     if (isFileUpload) {
       const token = TokenStorage.getAccessToken();
       // 원본 헤더 참조
       const originalHeaders = init.headers || {};
       
       // 새 헤더 객체 생성 (Content-Type은 자동 설정되도록 생략)
       const headers: Record<string, string> = {};
       
       // 헤더 복사 로직 - Headers 인스턴스인 경우
       if (originalHeaders instanceof Headers) {
         originalHeaders.forEach((value, key) => {
           // Content-Type을 제외한 모든 헤더 복사
           if (key.toLowerCase() !== 'content-type') {
             headers[key] = value;
           }
         });
       } 
       // 헤더 복사 로직 - 일반 객체인 경우
       else if (typeof originalHeaders === 'object') {
         Object.entries(originalHeaders).forEach(([key, value]) => {
           // Content-Type을 제외한 모든 헤더 복사
           if (key.toLowerCase() !== 'content-type') {
             headers[key] = value as string;
           }
         });
       }
       
       // 토큰이 있는 경우 Authorization 헤더 추가
       if (token) {
         headers['Authorization'] = `Bearer ${token}`;
       }
       
       // 파일 업로드용 요청 옵션 생성
       const newInit = {
         ...init,
         headers
       };
       
       // 특별 처리된 옵션으로 원본 fetch 호출
       return originalFetch(input, newInit);
     }

     /**
      * 토큰 및 사용자 정보 사전 검증 함수
      * 
      * @description
      * - 토큰 존재 여부 확인
      * - 토큰 만료 체크 
      * - 필요 시 자동 갱신
      * - 사용자 정보 동기화
      * @returns 검증된 유효한 액세스 토큰
      */
     const validateTokenAndUser = async () => {
       try {
         // 현재 토큰 조회
         const currentToken = TokenStorage.getAccessToken();
         
         // 사용자 상태 저장소 참조 (안전하게 함수 내에서 호출)
         const userStore = useUserStore.getState();

         // 토큰 없음 처리 - 로그인 페이지로 리다이렉트
         if (!currentToken) {
           console.warn('[FetchInterceptor] 토큰 없음, 로그인 필요');
           toast.error('로그인이 필요합니다.');
           window.location.href = '/login';
           throw new Error('No token');
         }

         // 토큰 만료 체크 및 자동 갱신
         if (TokenStorage.isTokenExpired()) {
           console.log('[Fetch] 토큰 만료 감지, 자동 갱신 시도');
           
           // 토큰 갱신 시도
           const newToken = await refreshAccessToken();
           
           // 토큰 갱신 실패 처리 - 로그인 페이지로 리다이렉트
           if (!newToken) {
             // clearUser 메서드 존재 여부 확인 후 호출 (안전한 처리)
             if (userStore.clearUser) {
               userStore.clearUser();
             }
             toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
             window.location.href = '/login';
             throw new Error('Token refresh failed');
           }
           
           // 새로 갱신된 토큰 반환
           return newToken;
         }
         
         // 사용자 정보 동기화 (토큰 유효한 경우)
         // 훅 규칙 준수: useUserStore는 함수 내에서만 사용
         if (userStore.user && userStore.fetchUserInfo && TokenStorage.isTokenExpired()) {
           try {
             // 사용자 정보 갱신
             await userStore.fetchUserInfo();
           } catch (error) {
             // 사용자 정보 갱신 실패해도 요청은 계속 진행
             console.error('[FetchInterceptor] 사용자 정보 갱신 실패', error);
           }
         }
         
         // 현재 유효한 토큰 반환
         return currentToken;
       } catch (error) {
         // 토큰 검증 실패 로그 및 예외 전파
         console.error('[FetchInterceptor] 토큰 검증 실패:', error);
         throw error;
       }
     };

     // 토큰 검증 및 갱신 수행
     const token = await validateTokenAndUser();
     
     // 검증된 토큰으로 요청 헤더 구성
     const requestOptions = {
       ...init,
       headers: {
         'Content-Type': 'application/json',    // 기본 Content-Type 설정
         'Authorization': `Bearer ${token}`,     // 인증 토큰 설정
         'Accept': '*/*',                       // 모든 응답 타입 허용
         ...(init.headers || {})                // 기존 헤더 유지 (충돌 시 덮어씀)
       }
     };

     // 최종 요청 전송
     console.log('[FetchInterceptor] API 요청 전송:', url);
     const response = await originalFetch(input, requestOptions);
     console.log('[FetchInterceptor] API 응답 상태:', response.status);

     // 응답 오류 처리 (HTTP 상태 코드가 성공이 아닌 경우)
     if (!response.ok) {
       // response.clone()으로 응답 본문을 안전하게 읽음
       // (응답 본문은 한 번만 읽을 수 있으므로 복제 필요)
       const clonedResponse = response.clone();
       try {
         // 오류 응답 본문 읽기
         const errorText = await clonedResponse.text();
         console.warn('[FetchInterceptor] 오류 응답:', errorText);
         
         // 토큰 관련 오류인 경우 갱신 후 재시도
         if (errorText.includes('토큰') || response.status === 401) {
           console.log('[FetchInterceptor] 토큰 오류 감지, 갱신 시도');
           const refreshedToken = await refreshAccessToken();
           
           // 토큰 갱신 성공 시 요청 재시도
           if (refreshedToken) {
             requestOptions.headers['Authorization'] = `Bearer ${refreshedToken}`;
             console.log('[FetchInterceptor] 토큰 갱신 후 요청 재시도');
             return originalFetch(input, requestOptions);
           }
         }
       } catch (textError) {
         // 응답 본문 파싱 실패해도 원본 응답은 반환
         console.error('[FetchInterceptor] 오류 응답 파싱 실패:', textError);
       }
     }

     // 최종 응답 반환 (성공 또는 실패)
     return response;

   } catch (error) {
     // 전역 에러 핸들링 - 모든 예외 상황 처리
     console.error('[Fetch Interceptor] 요청 중 오류:', error);
     
     // 에러 타입별 처리 - 사용자에게 적절한 메시지 표시
     if (error instanceof Error) {
       switch (error.message) {
         case 'No token':
         case 'Token refresh failed':
           // 이미 이전 단계에서 처리됨 (로그인 페이지 리다이렉트 등)
           break;
         default:
           // 기타 에러는 일반 메시지로 표시
           toast.error('요청 처리 중 오류가 발생했습니다.');
       }
     }
     
     // 에러 전파 - 호출자가 직접 처리할 수 있도록 함
     throw error;
   }
 };
};

// 브라우저 환경에서만 인터셉터 설정 (SSR 환경에서 오류 방지)
if (typeof window !== 'undefined') {
 setupInterceptor();
}

export default setupInterceptor;