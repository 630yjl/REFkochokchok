// src/components/Login/index.tsx
"use client";

/**
 * 로그인 컴포넌트
 * 
 * 주요 기능:
 * - 이메일/비밀번호 기반 로그인
 * - 폼 유효성 검증
 * - 에러 메시지 표시
 * - 로딩 상태 처리
 * 
 * 수정사항 (2024.02.04):
 * 1. 레이아웃 구조 변경 (fixed positioning 활용)
 * 2. 스타일 시스템 적용 (globals.css, tailwind.config 활용)
 * 3. px to rem 변환 적용
 * 4. Input, Button 컴포넌트 스타일 최적화
 * 
 * 수정사항 (2024.02.16):
 * 1. 에러 메시지 처리 로직 개선
 * 2. 입력 필드 변경 시 에러 메시지 초기화
 * 3. 중복 에러 메시지 표시 방지
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, Control } from "react-hook-form";
import Logo from "@/../public/images/logo_lg.svg";
import Button from "@/commons/Button";
import Input from "@/commons/input";
import { useLogin } from "./hook";
import type { LoginFormData, LoginFormField } from "./types";

export default function LoginComponent() {
  const router = useRouter();
  const { form, isLoading, onSubmit, loginMessage, setLoginMessage } = useLogin();
  const { formState: { errors, isValid }, control } = form;

  return (
    // 전체 화면 고정 컨테이너
    <div className="fixed inset-0 bg-loginpage-bg">
      {/* 중앙 정렬을 위한 컨테이너 */}
      <div className="flex items-center justify-center h-screen w-screen px-[1.25rem]">
        {/* 콘텐츠 영역 */}
        <div className="flex items-center flex-col w-full gap-[3.75rem]">
          {/* 로고 영역 */}
          <div className="w-[12.5625rem] h-[7.875rem]">
            <Image 
              src={Logo} 
              alt="logo" 
              priority 
              className="w-full h-full object-contain"
            />
          </div>

          {/* 폼 영역 */}
          <form onSubmit={onSubmit} className="w-full flex flex-col gap-[1.75rem]">
            {/* 이메일 입력 */}
            <Controller<LoginFormData>
              name="email"
              control={control as Control<LoginFormData>}
              render={({ field }: { field: LoginFormField }) => (
                <Input
                  type="email"
                  placeholder="이메일"
                  error={
                    loginMessage?.type === "error"
                      ? undefined
                      : errors.email?.message
                  }
                  className="w-full"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setLoginMessage(null); // 새로운 입력 시 에러 메시지 초기화
                  }}
                />
              )}
            />

            {/* 비밀번호 입력 */}
            <Controller<LoginFormData>
              name="password"
              control={control as Control<LoginFormData>}
              render={({ field }: { field: LoginFormField }) => (
                <Input
                  type="password"
                  placeholder="비밀번호"
                  error={
                    loginMessage?.type === "error"
                      ? undefined
                      : errors.password?.message
                  }
                  className="w-full"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setLoginMessage(null); // 새로운 입력 시 에러 메시지 초기화
                  }}
                />
              )}
            />

            {/* 로그인 에러 메시지 */}
            {loginMessage?.type === "error" && (
              <span className="text-error-message">{loginMessage.message}</span>
            )}

            {/* 로그인 버튼 */}
            <Button 
              design="design1" 
              type="submit" 
              disabled={!isValid || isLoading}
              className="text-base-bold"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 회원가입 버튼 */}
          <Button
            design="design4"
            width="fit"
            onClick={() => router.push("/signup")}
          >
            회원가입
          </Button>
        </div>
      </div>
    </div>
  );
}
