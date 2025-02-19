// src/components/MyPageEdit/hook.ts
"use client";

/**
 * 프로필 수정 커스텀 훅
 *
 * ✨ 주요 기능:
 * 1. 프로필 이미지 업로드/수정/삭제
 *   - 이미지 미리보기와 서버 업로드 분리
 *   - 저장 버튼 클릭 시에만 전역 상태 업데이트
 * 2. 닉네임 변경 및 유효성 검사
 * 3. 비밀번호 변경 및 유효성 검사
 * 4. 로그아웃/회원탈퇴 처리
 * 5. 폼 상태 및 UI 상태 관리
 *
 * 🔄 수정사항 (2024.02.20):
 * 1. 이미지 관리 방식 개선
 *   - 이미지 선택 시 로컬 미리보기 생성
 *   - 실제 서버 업로드는 저장 버튼 클릭 시로 지연
 *   - tempImageFile 상태 추가하여 업로드할 파일 추적
 * 2. 메모리 관리 최적화
 *   - 미사용 blob URL 해제 로직 추가
 * 3. 사용자 경험 개선
 *   - 이미지 변경 즉시 미리보기 제공
 *   - 최종 저장은 버튼 클릭 시에만 수행
 *
 * 💡 프로필 이미지 관련:
 * - 기본 이미지: /images/profileEdit_Img_upload_btn_img.svg
 * - 카메라 아이콘: /images/profileEdit_camera.svg
 * - 이미지 업로드 API: POST /api/uploads/single
 * - 이미지 수정 API: PUT /api/users/profile-image
 * - 이미지 삭제 API: DELETE /api/users/profile-image
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/commons/store/userStore";
import { TokenStorage } from "@/components/auth/utils/tokenUtils";
import { useProfileImage } from "@/components/MypageEdit/useProfileImage";

export const useProfileEdit = () => {
  const router = useRouter();
  const { user, updateUserInfo, clearUser } = useUserStore();
  
  // useProfileImage 훅 사용
  const {
    tempImageUrl,
    tempImageFile,
    isImageChanged,
    isLoading: isImageLoading,
    previewImage,
    uploadImage,
    updateProfileImage,
    deleteProfileImage,
    cleanup: cleanupImageResources
  } = useProfileImage();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const [modalType, setModalType] = useState<"logout" | "withdraw" | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 폼 데이터 상태
  const [nickname, setNickname] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isNicknameChanged, setIsNicknameChanged] = useState(false);

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      cleanupImageResources();
    };
  }, [cleanupImageResources]);

  /**
   * 비밀번호 유효성 검사 함수
   * @param password 검사할 비밀번호
   * @returns 유효성 검사 결과 객체
   */
  const validatePassword = useCallback((password: string) => {
    if (!password) {
      return {
        hasMultipleTypes: false,
        hasValidLength: false,
        noConsecutive: false,
      };
    }

    // 각 문자 타입 존재 여부 확인
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // 포함된 문자 타입 개수 계산
    const typeCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

    return {
      hasMultipleTypes: typeCount >= 2,
      hasValidLength:
        password.length >= 7 &&
        password.length <= 32 &&
        !password.includes(" "),
      noConsecutive: !/(.)\1{2,}/.test(password),
    };
  }, []);

  /**
   * 이미지 변경 핸들러 (미리보기만 생성)
   * @param file 선택한 이미지 파일
   */
  const handleImageChange = useCallback(
    (file: File | null) => {
      if (!file) return;
      
      // 이미지 미리보기 생성 (서버에 업로드하지 않음)
      previewImage(file);
    },
    [previewImage]
  );

  /**
   * 프로필 이미지 삭제 처리
   */
  const handleImageDelete = useCallback(async () => {
    try {
      await deleteProfileImage();
      
      // 전역 상태 업데이트
      updateUserInfo({ profileImage: undefined });
    } catch (error) {
      console.error("[ProfileEdit] 이미지 삭제 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "이미지 삭제에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [deleteProfileImage, updateUserInfo]);

  /**
   * 변경사항 저장 처리
   * 이미지와 닉네임 변경사항을 최종 저장
   */
  const saveChanges = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 1. 이미지 변경이 있으면 서버에 업로드
      if (isImageChanged && tempImageFile) {
        // 이미지 서버에 업로드
        const imageUrl = await uploadImage();
        
        if (imageUrl) {
          // 프로필 이미지 변경 API 호출
          await updateProfileImage(imageUrl);
          
          // 전역 상태 업데이트
          updateUserInfo({ profileImage: imageUrl });
        }
      }

      // 2. 닉네임 업데이트 (변경된 경우에만)
      if (isNicknameChanged && nickname !== user?.name) {
        const token = TokenStorage.getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch("/api/users/name", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: nickname }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Nickname Update] Error:", errorData);
          throw new Error(errorData.message || "닉네임 변경에 실패했습니다");
        }

        // 전역 상태 업데이트
        updateUserInfo({ name: nickname });
      }

      // 성공 시 마이페이지로 이동
      router.push("/mypage");
    } catch (error) {
      console.error("[SaveChanges] Error:", error);
      alert(
        error instanceof Error ? error.message : "변경사항 저장에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    isImageChanged,
    tempImageFile,
    uploadImage,
    updateProfileImage,
    isNicknameChanged,
    nickname,
    user?.name,
    router,
    updateUserInfo,
  ]);

  /**
   * 비밀번호 변경 처리
   */
  const handlePasswordUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
  
      // TokenStorage에서 토큰 가져오기
      const token = TokenStorage.getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }
  
      const response = await fetch("/api/users/password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "비밀번호 변경에 실패했습니다");
      }

      // 성공 모달 표시
      setShowSuccessModal(true);

      // 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setIsPasswordFormVisible(false);
    } catch (error) {
      console.error("[ProfileEdit] 비밀번호 변경 실패:", error);
      alert(
        error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword]);

  /**
   * 모달 확인 버튼 핸들러
   * 비밀번호 변경 성공 시 로그아웃 처리
   */
  const handleModalConfirm = useCallback(() => {
    setShowSuccessModal(false);
    TokenStorage.clearTokens();
    clearUser();
    router.push("/login");
  }, [clearUser, router]);

  /**
   * 회원 탈퇴 처리
   */
  const handleWithdraw = useCallback(async () => {
    try {
      // TokenStorage에서 토큰 가져오기
      const token = TokenStorage.getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }
  
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "회원 탈퇴에 실패했습니다");
      }
  
      TokenStorage.clearTokens();
      clearUser();
      router.push("/login");
    } catch (error) {
      console.error("[ProfileEdit] 회원 탈퇴 실패:", error);
      alert(error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다");
    }
  }, [clearUser, router]);

  /**
   * 로그아웃 처리
   */
  const handleLogout = useCallback(() => {
    TokenStorage.clearTokens();
    clearUser();
    router.push("/login");
  }, [clearUser, router]);

  /**
   * 닉네임 변경 핸들러
   */
  const handleNicknameChange = useCallback(
    (value: string) => {
      setNickname(value);
      setIsNicknameChanged(value !== user?.name);
    },
    [user?.name]
  );

  /**
   * 버튼 텍스트 결정 함수
   * 변경 상태에 따른 동적 텍스트 반환
   */
  const getButtonText = useCallback(() => {
    if (isImageChanged && isNicknameChanged) return "변경사항 저장";
    if (isImageChanged) return "프로필 사진 변경";
    if (isNicknameChanged) return "닉네임 변경";
    return "변경";
  }, [isImageChanged, isNicknameChanged]);

  return {
    // 상태
    user,
    isLoading: isLoading || isImageLoading,
    isPasswordFormVisible,
    modalType,
    showSuccessModal,
    nickname,
    currentPassword,
    newPassword,
    tempImageUrl,
    tempImageFile,
    isImageChanged,
    isNicknameChanged,

    // 상태 변경 함수
    setModalType,
    setNickname: handleNicknameChange,
    setCurrentPassword,
    setNewPassword,
    setIsPasswordFormVisible,
    setShowSuccessModal,

    // 유효성 검사
    validatePassword,

    // 이벤트 핸들러
    handleImageChange,
    handleImageDelete,
    saveChanges,
    handlePasswordUpdate,
    handleLogout,
    handleWithdraw,
    handleModalConfirm,
    getButtonText,
  };
};