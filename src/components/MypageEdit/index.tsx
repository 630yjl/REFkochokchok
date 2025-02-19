// src/components/MyPageEdit/index.tsx
"use client";

/**
 * 프로필 수정 컴포넌트
 *
 * ✨ 주요 기능:
 * 1. 프로필 이미지 관리 - ProfileImageManager 컴포넌트로 분리
 *   - 이미지 업로드/수정/삭제
 *   - 이미지 관리 로직과 UI 분리
 *
 * 2. 닉네임 수정
 *   - 입력값 유효성 검사
 *   - 실시간 상태 업데이트
 *
 * 3. 비밀번호 변경
 *   - 아코디언 스타일 UI
 *   - 강화된 유효성 검사
 *   - 성공 시 자동 로그아웃
 *
 * 4. 계정 관리
 *   - 로그아웃
 *   - 회원탈퇴
 *
 * 🔄 수정사항 (2024.02.14):
 * 1. 이미지 처리 로직 개선 및 분리
 *   - ProfileImageManager 컴포넌트 도입
 *   - 이미지 상태 관리 최적화
 * 2. 컴포넌트 구조 최적화
 * 3. 에러 처리 강화
 * 4. 접근성 개선
 */

import { useRef } from "react";
import Image from "next/image";
import Button from "@/commons/Button";
import Input from "@/commons/input";
import Modal from "@/commons/Modal";
import { useProfileEdit } from "./hook";
import ProfileImageManager from "@/components/MypageEdit/ProfileImageManager";

// 아이콘 imports 
import CheckIcon from "@/../public/icons/signup_check_disabled_icon_24px.svg";
import CheckValidIcon from "@/../public/icons/signup_check_valid_icon_24px.svg";
import CollapseIcon from "@/../public/icons/editAccount_collapse_24px.svg";
import ExpandIcon from "@/../public/icons/editAccount_expand_24px.svg";

/**
 * 비밀번호 유효성 검사 아이템 컴포넌트
 */
interface PasswordValidationItemProps {
  isValid: boolean;
  text: string;
}

const PasswordValidationItem = ({
  isValid,
  text,
}: PasswordValidationItemProps) => (
  <div className="flex items-center gap-2">
    <Image
      src={isValid ? CheckValidIcon : CheckIcon}
      alt=""
      width={24}
      height={24}
    />
    <p
      className={`text-sm-medium-quaternary ${isValid ? "!text-primary" : ""}`}
    >
      {text}
    </p>
  </div>
);

export default function ProfileEdit() {
  const {
    user,
    isLoading,
    isPasswordFormVisible,
    modalType,
    showSuccessModal,
    nickname,
    currentPassword,
    newPassword,
    tempImageUrl,
    validatePassword,
    setModalType,
    setNickname,
    setCurrentPassword,
    setNewPassword,
    setIsPasswordFormVisible,
    handleImageChange,
    handleImageDelete,
    saveChanges,
    handlePasswordUpdate,
    handleLogout,
    handleWithdraw,
    handleModalConfirm,
    getButtonText,
  } = useProfileEdit();

  // 🎯 Refs
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // 비밀번호 유효성 검사 결과
  const passwordValidation = validatePassword(newPassword);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="w-full px-5 pt-12 pb-24 flex flex-col space-y-7">
        <section className="space-y-7">
          {/* 프로필 이미지 영역 - 분리된 컴포넌트 사용 */}
          <div className="grid gap-[1.375rem]">
            <h2 className="text-sm-bold">프로필 정보 수정</h2>
            
            {/* 👇 ProfileImageManager 컴포넌트로 대체 */}
            <ProfileImageManager
              currentImageUrl={user?.profileImage}
              tempImageUrl={tempImageUrl}
              onImageChange={handleImageChange}
              onImageDelete={handleImageDelete}
              isLoading={isLoading}
            />
          </div>

          {/* 닉네임 변경 영역 */}
          <div className="space-y-1">
            <label htmlFor="nickname" className="text-sm-bold">
              닉네임
            </label>
            <div className="flex items-center gap-3">
              {/* 🔑 Input을 감싸는 래퍼 div 추가 */}
              <div className="flex-1">
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력해주세요"
                  className="w-full text-base-medium" // 🆕 w-full 추가
                />
              </div>
              <Button
                design="design1"
                width="fit" // 내용물 크기에 맞춤
                className="w-[40%]" // 명시적 너비 지정
                onClick={saveChanges}
                disabled={isLoading}
              >
                {getButtonText()}
              </Button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-7 border-b border-[#E9E8E3]" />

          {/* 비밀번호 변경 토글 버튼 */}
          {!isPasswordFormVisible && (
            <Button
              design="design2"
              onClick={() => setIsPasswordFormVisible(true)}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              <Image src={CollapseIcon} alt="" width={24} height={24} />
              <span>비밀번호 변경</span>
            </Button>
          )}
        </section>

        {/* 비밀번호 변경 폼 (아코디언) */}
        {isPasswordFormVisible && (
          <section ref={passwordSectionRef} className="space-y-7">
            {/* 현재 비밀번호 입력 */}
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="text-sm-bold">
                현재 비밀번호
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력해주세요"
                className="w-full text-base-medium"
              />
            </div>

            {/* 새 비밀번호 입력 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="newPassword" className="text-sm-bold">
                  새 비밀번호
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력해주세요"
                  className="w-full text-base-medium"
                />
              </div>

              {/* 비밀번호 유효성 체크 표시 */}
              <div className="py-3 space-y-2">
                <PasswordValidationItem
                  isValid={passwordValidation.hasMultipleTypes}
                  text="영문/숫자/특수문자 중, 2가지 이상 포함"
                />
                <PasswordValidationItem
                  isValid={passwordValidation.hasValidLength}
                  text="7자 이상 32자 이하 입력 (공백 제외)"
                />
                <PasswordValidationItem
                  isValid={
                    Boolean(newPassword) && passwordValidation.noConsecutive
                  }
                  text="연속 3자 이상 동일한 문자/숫자 제외"
                />
              </div>

              {/* 버튼 영역 */}
              <div className="flex gap-3 mt-4">
                <Button
                  design="design2"
                  width="fit" // 🔑 중요: width를 'fit'으로 변경
                  onClick={() => setIsPasswordFormVisible(false)}
                  className="w-[30%] h-12" // Tailwind로 추가 너비 조정
                >
                  <Image src={ExpandIcon} alt="" width={24} height={24} />
                  <span>취소</span>
                </Button>
                <Button
                  design="design1"
                  width="fit" // 🔑 중요: width를 'fit'으로 변경
                  onClick={handlePasswordUpdate}
                  disabled={isLoading}
                  className="flex-1" // 나머지 공간 차지
                >
                  비밀번호 변경
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 계정 관리 버튼 영역 */}
        <section className="flex flex-col items-center gap-4">
          <Button
            design="design1"
            className="w-full !bg-[#E8E7E3] !text-[#26210C]"
            onClick={() => setModalType("logout")}
          >
            로그아웃
          </Button>
          <Button design="design4" onClick={() => setModalType("withdraw")}>
            회원탈퇴
          </Button>
        </section>
      </main>

      {/* 모달 영역 */}
      <Modal
        isOpen={modalType === "logout"}
        onClose={() => setModalType(null)}
        onConfirm={handleLogout}
        title="로그아웃"
        description="정말 로그아웃 하시겠습니까?"
        confirmText="확인"
      />
      <Modal
        isOpen={modalType === "withdraw"}
        onClose={() => setModalType(null)}
        onConfirm={handleWithdraw}
        title="회원탈퇴"
        description="정말 탈퇴하시겠습니까?"
        confirmText="탈퇴"
      />
      <Modal
        isOpen={showSuccessModal}
        onConfirm={handleModalConfirm}
        hasCancel={false}
        title="비밀번호 변경 성공"
        description={`비밀번호가 변경되었습니다\n로그인을 다시 해주세요`}
        confirmText="확인"
      />
    </div>
  );
}