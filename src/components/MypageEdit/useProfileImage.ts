// src/components/MyPageEdit/useProfileImage.ts
"use client";

/**
* 프로필 이미지 관리 커스텀 훅
* 
* ✨ 주요 기능:
* 1. 이미지 미리보기 생성 및 업로드 분리
* 2. 이미지 상태 관리 (임시 URL, 임시 파일)
* 3. 이미지 업로드/변경/삭제 로직
* 4. 미리보기와 실제 업로드 분리로 UX 개선
* 
* 🔄 기존 useProfileEdit 훅에서 분리:
* - 이미지 관련 로직만 분리하여 응집도 향상
* - 재사용 가능한 형태로 구성
* 
* 📝 업데이트 (2025.02.18):
* - 이미지 미리보기와 업로드 기능 분리
* - 로컬 URL 생성으로 즉시 미리보기 제공
* - 임시 파일 객체 저장으로 지연 업로드 가능
*/

import { useState, useCallback } from "react";
import { TokenStorage } from "@/components/auth/utils/tokenUtils";

export const useProfileImage = () => {
 // 이미지 관련 상태
 const [tempImageUrl, setTempImageUrl] = useState<string | null>(null); // 미리보기용 URL
 const [tempImageFile, setTempImageFile] = useState<File | null>(null); // 임시 저장된 파일 객체
 const [isImageChanged, setIsImageChanged] = useState(false); // 이미지 변경 여부
 const [isLoading, setIsLoading] = useState(false); // 로딩 상태

 /**
  * 이미지 선택 시 임시 미리보기 생성
  * @param file 선택한 이미지 파일
  * @returns void
  */
 const previewImage = useCallback((file: File) => {
   // 파일 유효성 검사
   if (file.size > 5 * 1024 * 1024) {
     alert("파일 크기는 5MB를 초과할 수 없습니다.");
     return;
   }

   if (!file.type.startsWith("image/")) {
     alert("이미지 파일만 업로드 가능합니다.");
     return;
   }

   // 기존 URL 정리 (메모리 관리)
   if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
     URL.revokeObjectURL(tempImageUrl);
   }

   // 로컬 URL 생성 (업로드하지 않고 미리보기용)
   const localUrl = URL.createObjectURL(file);
   
   // 상태 업데이트
   setTempImageUrl(localUrl);
   setTempImageFile(file); // 파일 객체 저장
   setIsImageChanged(true);

   console.log("[ProfileImage] 미리보기 생성:", {
     fileName: file.name,
     fileSize: `${Math.round(file.size/1024)}KB`,
     localUrl: localUrl
   });
 }, [tempImageUrl]);

 /**
  * 프로필 이미지 업로드 처리 (저장 버튼 클릭 시 실행)
  * @returns 업로드된 이미지 URL 또는 null
  */
 const uploadImage = useCallback(async () => {
   // 임시 파일이 없으면 업로드 불필요
   if (!tempImageFile) return null;
   
   try {
     setIsLoading(true);
     console.log("[Upload] 업로드 시작:", tempImageFile.name);
     
     // FormData 사용하여 멀티파트 요청 준비
     const formData = new FormData();
     formData.append("file", tempImageFile);
     
     // multipart/form-data 형식으로 요청 (Content-Type 헤더 설정하지 않음)
     const response = await fetch("/api/uploads/single", {
       method: "POST",
       // headers 설정 없음! 브라우저가 자동으로 설정
       body: formData
     });
     
     console.log("[Upload] 응답 상태:", response.status, response.statusText);
     
     // 오류 응답 처리
     if (!response.ok) {
       let errorMessage = "이미지 업로드에 실패했습니다";
       try {
         const errorData = await response.json();
         console.error("[Upload] 상세 에러:", errorData);
         errorMessage = errorData.message || errorMessage;
       } catch (error) {
         console.error("[Upload] 파싱 에러:", error);
         const errorText = await response.text();
         console.error("[Upload] 에러 텍스트:", errorText);
       }
       throw new Error(errorMessage);
     }
     
     // 성공 응답 처리
     const imageUrl = await response.text();
     console.log("[Upload] 성공 - 이미지 URL:", imageUrl);
     
     // 로컬 URL 해제 (메모리 관리)
     if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
       URL.revokeObjectURL(tempImageUrl);
     }
     
     // 서버에서 받은 URL로 상태 업데이트
     setTempImageUrl(imageUrl);
     setTempImageFile(null); // 업로드 완료 후 임시 파일 참조 제거
     
     return imageUrl;
   } catch (error) {
     console.error("[ProfileImage] 이미지 업로드 실패:", error);
     throw error;
   } finally {
     setIsLoading(false);
   }
 }, [tempImageFile, tempImageUrl]);

 /**
  * 프로필 이미지 변경 API 호출
  * @param imageUrl 업로드된 이미지 URL
  * @returns 성공 여부 (boolean)
  */
 const updateProfileImage = useCallback(async (imageUrl: string) => {
   try {
     setIsLoading(true);
     
     // TokenStorage에서 토큰 가져오기
     const token = TokenStorage.getAccessToken();
     if (!token) {
       throw new Error("인증 토큰이 없습니다.");
     }

     // 프로필 이미지 변경 API 호출
     const response = await fetch("/api/users/profile-image", {
       method: "PUT",
       headers: {
         Authorization: `Bearer ${token}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({ profileImage: imageUrl }),
     });

     // 오류 응답 처리
     if (!response.ok) {
       const errorData = await response.json();
       console.error("[ProfileImage] Update error:", errorData);
       throw new Error(errorData.message || "프로필 이미지 업데이트 실패");
     }

     console.log("[ProfileImage] Update success");
     return true;
   } catch (error) {
     console.error("[ProfileImage] 이미지 변경 실패:", error);
     throw error;
   } finally {
     setIsLoading(false);
   }
 }, []);

 /**
  * 프로필 이미지 업로드 및 변경 처리 (원스텝 처리용, 레거시 지원)
  * @param file 업로드할 이미지 파일
  * @returns 업로드된 이미지 URL
  */
 const handleImageUpload = useCallback(async (file: File) => {
   try {
     // 로컬 객체 생성 및 저장
     setTempImageFile(file);
     
     // 1. 이미지 파일 업로드
     const imageUrl = await uploadImage();
     if (!imageUrl) throw new Error("이미지 업로드에 실패했습니다");
     
     // 2. 프로필 이미지 변경 API 호출
     await updateProfileImage(imageUrl);
     
     return imageUrl;
   } catch (error) {
     console.error("[ProfileImage] 이미지 업로드/변경 실패:", error);
     alert(
       error instanceof Error
         ? error.message
         : "이미지 업로드에 실패했습니다. 다시 시도해주세요."
     );
     throw error;
   }
 }, [uploadImage, updateProfileImage]);

 /**
  * 프로필 이미지 삭제 처리
  * @returns 성공 여부 (boolean)
  */
 const deleteProfileImage = useCallback(async () => {
   try {
     setIsLoading(true);
     
     // 기존 URL 정리 (메모리 관리)
     if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
       URL.revokeObjectURL(tempImageUrl);
     }
     
     const token = TokenStorage.getAccessToken();
     if (!token) {
       throw new Error("인증 토큰이 없습니다.");
     }

     // 프로필 이미지 삭제 API 호출
     const response = await fetch("/api/users/profile-image", {
       method: "DELETE",
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     // 오류 응답 처리
     if (!response.ok) {
       const errorData = await response.json();
       console.error("[ProfileImage] Delete error:", errorData);
       throw new Error(
         errorData.message || "프로필 이미지 삭제에 실패했습니다"
       );
     }

     // 상태 초기화
     setTempImageUrl(null);
     setTempImageFile(null);
     setIsImageChanged(false);
     
     return true;
   } catch (error) {
     console.error("[ProfileImage] 이미지 삭제 실패:", error);
     throw error;
   } finally {
     setIsLoading(false);
   }
 }, [tempImageUrl]);

 /**
  * 컴포넌트 언마운트 시 정리 작업
  * 사용하지 않는 blob URL 해제
  */
 const cleanup = useCallback(() => {
   if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
     URL.revokeObjectURL(tempImageUrl);
     console.log("[ProfileImage] 미사용 리소스 정리 완료");
   }
 }, [tempImageUrl]);

 return {
   // 상태
   tempImageUrl,        // 미리보기 이미지 URL
   tempImageFile,       // 임시 저장된 파일 객체
   isImageChanged,      // 이미지 변경 여부
   isLoading,           // 로딩 상태
   
   // 메서드
   previewImage,        // 이미지 미리보기 생성 (업로드 없음)
   uploadImage,         // 서버에 이미지 업로드 (저장 시 호출)
   updateProfileImage,  // 프로필 이미지 URL 업데이트
   handleImageUpload,   // 원스텝 업로드 (레거시 지원)
   deleteProfileImage,  // 프로필 이미지 삭제
   cleanup,             // 자원 정리
   
   // 상태 설정자
   setTempImageUrl,
   setTempImageFile,
   setIsImageChanged,
 };
};