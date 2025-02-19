// src/components/Login/hook.ts
"use client";

/**
 * 로그인 커스텀 훅
 *
 * 주요 기능:
 * 1. 로그인 폼 상태 관리 (react-hook-form + zod)
 * 2. 로그인 API 통신
 * 3. 토큰 관리 (TokenStorage 사용)
 * 4. 사용자 정보 관리 (UserStore 사용)
 *
 * 수정사항 (2024.02.04):
 * - TokenStorage를 통한 토큰 관리 일원화
 * - API 응답 타입 정확히 정의
 * - 에러 처리 강화
 * - 디버깅 로그 개선
 * 
 * 수정사항 (2024.02.16):
 * - 로그인 메시지 상태 관리 추가
 * - 에러 메시지 중복 표시 방지
 * - 입력 시 에러 메시지 초기화 로직 추가
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserStore } from "@/commons/store/userStore";
import { TokenStorage } from "../../components/auth/utils/tokenUtils";
import {
  LoginFormData,
  LoginResponse,
  LoginErrorResponse,
  UserResponse,
} from "./types";

/**
 * 폼 유효성 검사 스키마
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요")
    .min(7, "비밀번호는 7자 이상이어야 합니다"),
});

/**
 * 로그인 커스텀 훅
 */
export const useLogin = () => {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<{
    type: "error";
    message: string;
  } | null>(null);

  // 폼 초기화
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * 사용자 정보 조회
   * @param userId 사용자 ID
   * @param token 액세스 토큰
   */
  const fetchUserInfo = async (
    userId: number,
    token: string
  ): Promise<UserResponse> => {
    try {
      console.log("[Login] 사용자 정보 조회 시작:", { userId });
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData: LoginErrorResponse = await response.json();
        throw new Error(errorData.message || "사용자 정보 조회에 실패했습니다");
      }

      const userInfo: UserResponse = await response.json();
      console.log("[Login] 사용자 정보 조회 성공:", userInfo);
      return userInfo;
    } catch (error) {
      console.error("[Login] 사용자 정보 조회 실패:", error);
      throw error;
    }
  };

  /**
   * JWT 토큰에서 사용자 ID 추출
   */
  const extractUserIdFromToken = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Number(payload.sub);
    } catch (error) {
      console.error("[Login] 토큰 파싱 실패:", error);
      throw new Error("토큰 파싱에 실패했습니다");
    }
  };

  /**
   * 폼 제출 핸들러
   */
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginMessage(null); // 로그인 시도 시 이전 메시지 초기화
    try {
      // 1. 로그인 API 호출
      console.log("[Login] 로그인 시도:", { email: data.email });
      const loginResponse = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // 2. 에러 응답 처리
      if (!loginResponse.ok) {
        const errorData: LoginErrorResponse = await loginResponse.json();
        setLoginMessage({
          type: "error",
          message: errorData.message || "로그인에 실패했습니다"
        });
        return;
      }

      // 3. 성공 응답 처리
      const loginResult: LoginResponse = await loginResponse.json();
      console.log("[Login] 로그인 성공");

      // 4. 토큰 저장
      TokenStorage.setTokens({
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      });

      // 5. 사용자 ID 추출
      const userId = extractUserIdFromToken(loginResult.accessToken);
      console.log("[Login] 토큰에서 추출한 사용자 ID:", userId);

      // 6. 상세 사용자 정보 조회
      const userInfo = await fetchUserInfo(userId, loginResult.accessToken);

      // 7. UserStore에 사용자 정보 저장
      setUser({
        id: userId,
        email: userInfo.email,
        name: userInfo.name || loginResult.name,
        profileImage: userInfo.profileImage || loginResult.profileImage,
      });

      // 8. 홈으로 이동
      router.push("/");
    } catch (error) {
      console.error("[Login] 에러 발생:", error);
      setLoginMessage({
        type: "error",
        message: error instanceof Error
          ? error.message
          : "로그인 처리 중 오류가 발생했습니다"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    onSubmit: form.handleSubmit(onSubmit),
    loginMessage,
    setLoginMessage,
  };
};