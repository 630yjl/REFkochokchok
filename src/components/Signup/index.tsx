// src/components/SignUp/index.tsx
"use client";

/**
 * 회원가입 컴포넌트
 *
 * ✨ 주요 기능:
 * 1. 회원가입 폼 렌더링 및 상태 관리
 * 2. 실시간 유효성 검사 피드백
 * 3. 중복 검사 결과 표시
 * 4. 회원가입 완료 모달
 *
 * 🔄 수정사항 (2024.02.12):
 * - 비밀번호 검증 로직을 스키마로 이동
 * - 실시간 피드백 UI 개선
 * - validatePassword 제거 (스키마로 통합)
 */

import Image from "next/image";
import { Controller } from "react-hook-form";
import Button from "@/commons/Button";
import Input from "@/commons/input";
import Modal from "@/commons/Modal";
import CheckIcon from "@/../public/icons/signup_check_disabled_icon_24px.svg";
import CheckValidIcon from "@/../public/icons/signup_check_valid_icon_24px.svg";
import { useSignUp } from "./hook";

export default function SignUpComponent() {
  // ✨ validatePassword 제거하고 필요한 값만 가져오기
  const {
    form,
    isLoading,
    onSubmit,
    emailMessage,
    nameMessage,
    handleEmailChange,
    handleNameChange,
    showSuccessModal,
    handleModalConfirm,
    passwordConfirmMessage,
    checkPasswordMatch,
  } = useSignUp();

  const {
    formState: { errors },
    watch,
  } = form;

  // ✨ 비밀번호 검증 UI를 위한 상태
  const password = watch("password");
  // 🔥 비밀번호 입력값이 있을 때만 검증
  const hasLetter = password ? /[a-zA-Z]/.test(password) : false;
  const hasNumber = password ? /[0-9]/.test(password) : false;
  const hasSpecial = password ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : false;
  const hasValidLength = password
    ? password.length >= 7 && password.length <= 32
    : false;
  const hasConsecutive = password ? !/(.)\1{2,}/.test(password) : false;
  const hasMultipleTypes = password
    ? [hasLetter, hasNumber, hasSpecial].filter(Boolean).length >= 2
    : false;

  return (
    <div className="flex items-center justify-center mw-full py-6 px-5 ">
      <div className="flex flex-col w-full mx-auto">
        {/* 회원가입 폼 */}
        <form onSubmit={onSubmit} className="flex flex-col gap-7">
          {/* 이메일 입력 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm-bold">
              이메일
            </label>
            {/* 🔥 에러 메시지 중복 방지를 위한 조건부 렌더링 */}
            <Controller
              name="email"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Input
                    {...field}
                    type="email"
                    placeholder="abc@kochokchok.com"
                    error={
                      emailMessage?.type === "error"
                        ? undefined
                        : errors.email?.message
                    }
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e);
                      handleEmailChange(e);
                    }}
                  />
                  {emailMessage && (
                    <span
                      className={`text-sm ${
                        emailMessage.type === "success"
                          ? "text-primary"
                          : "text-error"
                      }`}
                    >
                      {emailMessage.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* 닉네임 입력 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm-bold">
              닉네임
            </label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Input
                    {...field}
                    type="text"
                    placeholder="코촉촉"
                    error={
                      nameMessage?.type === "error"
                        ? undefined
                        : errors.name?.message
                    }
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e);
                      handleNameChange(e);
                    }}
                  />
                  {/* ✨ 닉네임 중복 검사 결과 메시지 */}
                  {nameMessage && (
                    <span
                      className={`text-sm ${
                        nameMessage.type === "success"
                          ? "text-primary"
                          : "text-error"
                      }`}
                    >
                      {nameMessage.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* 비밀번호 입력 영역 */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm-bold">
                비밀번호
              </label>
              <Controller
                name="password"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="password"
                    placeholder="********"
                    error={errors.password?.message}
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* ✨ 비밀번호 유효성 체크 표시 */}
            <div className="flex flex-col gap-2">
              {/* 복잡도 체크 */}
              <div className="flex items-center gap-2">
                <Image
                  src={hasMultipleTypes ? CheckValidIcon : CheckIcon}
                  alt="checkIcon"
                />
                <p
                  className={`text-sm-medium ${
                    hasMultipleTypes ? "text-primary" : "text-text-quaternary"
                  }`}
                >
                  영문/숫자/특수문자 중, 2가지 이상 포함
                </p>
              </div>

              {/* 길이 체크 */}
              <div className="flex items-center gap-2">
                <Image
                  src={hasValidLength ? CheckValidIcon : CheckIcon}
                  alt="checkIcon"
                />
                <p
                  className={`text-sm-medium ${
                    hasValidLength ? "text-primary" : "text-text-quaternary"
                  }`}
                >
                  7자 이상 32자 이하 입력 (공백 제외)
                </p>
              </div>

              {/* 연속 문자 체크 */}
              <div className="flex items-center gap-2">
                <Image
                  src={hasConsecutive ? CheckValidIcon : CheckIcon}
                  alt="checkIcon"
                />
                <p
                  className={`text-sm-medium ${
                    hasConsecutive ? "text-primary" : "text-text-quaternary"
                  }`}
                >
                  연속 3자 이상의 동일한 문자/숫자 제외
                </p>
              </div>
            </div>
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="passwordConfirm" className="text-sm-bold">
              비밀번호 확인
            </label>
            <Controller
              name="passwordConfirm"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Input
                    {...field}
                    type="password"
                    placeholder="비밀번호를 한번 더 입력해주세요"
                    value={field.value || ""}
                    error={
                      passwordConfirmMessage?.type === "error"
                        ? undefined
                        : errors.passwordConfirm?.message
                    }
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e);
                      checkPasswordMatch(password || "", e.target.value);
                    }}
                  />
                  {passwordConfirmMessage && (
                    <span
                      className={`text-sm ${
                        passwordConfirmMessage.type === "success"
                          ? "text-primary"
                          : "text-error"
                      }`}
                    >
                      {passwordConfirmMessage.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* 에러 메시지 표시 */}
          {errors.root && (
            <span className="text-error text-sm">{errors.root.message}</span>
          )}

          {/* 가입하기 버튼 */}
          <div className="mt-10">
            <Button
              design="design1"
              type="submit"
              disabled={!form.formState.isValid || isLoading}
            >
              {isLoading ? "가입 처리중..." : "가입하기"}
            </Button>
          </div>
        </form>

        {/* ✨ 회원가입 완료 모달 */}
        <Modal
          isOpen={showSuccessModal}
          onConfirm={handleModalConfirm}
          hasCancel={false}
          title="회원가입 성공"
          description={`회원가입이 완료되었습니다 \n 로그인 페이지로 이동합니다`}
          confirmText="확인"
        />
      </div>
    </div>
  );
}
