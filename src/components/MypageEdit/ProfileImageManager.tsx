// src/components/MyPageEdit/ProfileImageManager.tsx
"use client";

/**
 * 프로필 이미지 관리 컴포넌트
 * 
 * ✨ 주요 기능:
 * 1. 프로필 이미지 표시 및 파일 선택
 * 2. 이미지 미리보기 처리 (로컬 URL)
 * 3. 이미지 변경/삭제 UI 제공
 * 4. 바텀시트 모달 연동
 * 
 * 🔄 수정사항 (2024.02.20):
 * 1. 이미지 선택 시 즉시 미리보기 표시
 * 2. 최종 업로드는 부모 컴포넌트의 저장 버튼으로 지연
 * 3. 이미지 파일 검증 로직 추가
 * 4. 더 직관적인 이미지 관리 UX 제공
 * 
 * 💡 사용법:
 * <ProfileImageManager
 *   currentImageUrl={user?.profileImage}
 *   tempImageUrl={tempImageUrl}
 *   onImageChange={handleImageChange}
 *   onImageDelete={handleImageDelete}
 *   isLoading={isLoading}
 * />
 */

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import BottomSheetModal from "@/commons/BottomSheetModal";

// 아이콘 imports
import CameraIcon from "@/../public/images/profileEdit_camera.svg";

// 상수 정의
const DEFAULT_PROFILE_IMAGE = "/images/profileEdit_Img_upload_btn_img.svg";

interface ProfileImageManagerProps {
  currentImageUrl?: string | null;
  tempImageUrl: string | null;
  onImageChange: (file: File | null) => void;
  onImageDelete: () => Promise<void>;
  isLoading: boolean;
}

export default function ProfileImageManager({
  currentImageUrl,
  tempImageUrl,
  onImageChange,
  onImageDelete,
  isLoading
}: ProfileImageManagerProps) {
  // 로컬 상태 및 refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  /**
   * 파일 입력 변경 핸들러
   * 선택된 파일의 유효성을 검사하고 부모 컴포넌트에 전달
   * @param e 파일 입력 이벤트
   */
  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // 파일 유효성 검사
        if (selectedFile.size > 5 * 1024 * 1024) {
          alert("파일 크기는 5MB를 초과할 수 없습니다.");
          return;
        }

        if (!selectedFile.type.startsWith("image/")) {
          alert("이미지 파일만 업로드 가능합니다.");
          return;
        }

        console.log("[ProfileImageManager] 파일 선택:", {
          이름: selectedFile.name,
          크기: `${Math.round(selectedFile.size/1024)}KB`,
          타입: selectedFile.type
        });

        // 부모 컴포넌트의 이미지 변경 핸들러 호출 (미리보기 생성)
        onImageChange(selectedFile);
      } catch (error) {
        console.error("[ProfileImageManager] 파일 선택 오류:", error);
        alert("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        // 입력 필드 초기화 (동일 파일 재선택 가능하도록)
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onImageChange]
  );

  /**
   * 이미지 오류 핸들러
   * 이미지 로드 실패 시 기본 이미지로 대체
   * @param e 이미지 오류 이벤트
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement;
      if (target.src.includes(DEFAULT_PROFILE_IMAGE)) return;
      
      console.log("[ProfileImageManager] 이미지 로드 실패, 기본 이미지 사용");
      target.src = DEFAULT_PROFILE_IMAGE;
    },
    []
  );

  /**
   * 프로필 이미지 클릭 핸들러
   * 이미지가 없으면 파일 선택 다이얼로그, 있으면 바텀시트 열기
   */
  const handleProfileImageClick = useCallback(() => {
    if (!currentImageUrl && !tempImageUrl) {
      // 이미지가 없으면 파일 선택 다이얼로그 표시
      fileInputRef.current?.click();
    } else {
      // 이미지가 있으면 바텀시트 표시 (변경/삭제 옵션)
      setIsBottomSheetOpen(true);
    }
  }, [currentImageUrl, tempImageUrl]);

  /**
   * 바텀시트 메뉴 아이템 정의
   * 이미지 선택, 삭제, 창 닫기 액션 포함
   */
  const bottomSheetMenuItems = [
    {
      label: "내 앨범에서 선택",
      onClick: () => fileInputRef.current?.click(),
      type: "default" as const,
    },
    {
      label: "프로필 이미지 삭제",
      onClick: onImageDelete,
      type: "danger" as const,
    },
    {
      label: "창 닫기",
      onClick: () => setIsBottomSheetOpen(false),
      type: "cancel" as const,
    },
  ];

  // 현재 표시할 이미지 URL 결정 (우선순위: 미리보기 > 서버 이미지 > 기본 이미지)
  const displayImageUrl = tempImageUrl || currentImageUrl || DEFAULT_PROFILE_IMAGE;

  return (
    <div className="flex justify-center">
      <div className="relative w-[100px] h-[100px]">
        <button
          onClick={handleProfileImageClick}
          className="w-full h-full relative"
          disabled={isLoading}
          aria-label="프로필 이미지 변경"
        >
          <Image
            src={displayImageUrl}
            alt="프로필 이미지"
            fill
            sizes="100px" // 이미지 실제 크기에 맞게 설정
            priority
            onError={handleImageError}
            className="rounded-full object-cover"
          />
          {/* 카메라 아이콘 오버레이 */}
          <div className="absolute right-0 bottom-0 w-7 h-7 flex items-center justify-center">
            <Image
              src={CameraIcon}
              alt="카메라 아이콘"
              width={28}
              height={28}
            />
          </div>
        </button>
        
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          aria-label="이미지 파일 선택"
        />
      </div>

      {/* 프로필 이미지 관리 바텀시트 */}
      <BottomSheetModal
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        menuItems={bottomSheetMenuItems}
      />
    </div>
  );
}