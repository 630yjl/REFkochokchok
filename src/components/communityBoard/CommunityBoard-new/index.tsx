"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/commons/Button";
import Input from "@/commons/input";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { communityFormSchema } from "./schema";

const CommunityBoardNew = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    title: string;
    contents: string;
    images: File[];
  }>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      title: "",
      contents: "",
      images: [],
    },
  });

  const images = watch("images") || [];
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  // ✅ 파일 업로드 시 이미지 추가
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      setValue("images", [...(images || []), ...newFiles]);

      const previewURLs = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewImages([...previewImages, ...previewURLs]);
    }
  };

  // ✅ 이미지 미리보기에서 삭제 기능
  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setValue(
      "images",
      images.filter((_, i) => i !== index)
    );
  };

  const appnedImg = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ✅ 토큰 가져오기 함수
  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  // ✅ 이미지 업로드 함수
  const uploadImages = async (files: File[]) => {
    try {
      console.log("📤 이미지 업로드 시작...");

      const token = getAccessToken();
      if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      console.log("📸 전송할 이미지 파일:", formData.getAll("files"));

      const response = await fetch("/api/uploads/multiple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("✅ 이미지 업로드 완료! 응답 상태 코드:", response.status);

      if (!response.ok) throw new Error("파일 업로드 실패");

      const responseText = await response.text();
      console.log("📩 서버 응답 원본:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("📩 서버 응답 JSON:", data);
      } catch (jsonError) {
        console.error("❌ JSON 파싱 오류:", jsonError);
        throw new Error("서버 응답이 JSON 형식이 아닙니다.");
      }

      // 🔍 응답이 예상과 같은지 확인
      if (!data || !Array.isArray(data)) {
        console.error("❌ 서버 응답 데이터가 예상과 다름:", data);
        throw new Error("서버에서 올바른 이미지 URL을 반환하지 않았습니다.");
      }

      console.log("✅ 최종 반환 이미지 URL 목록:", data);
      return data; // ✅ URL 배열 반환
    } catch (error) {
      console.error("❌ 이미지 업로드 실패:", error);

      if (error instanceof Error) {
        alert("이미지 업로드에 실패했습니다. 오류 메시지: " + error.message);
      } else {
        alert("이미지 업로드에 실패했습니다. 알 수 없는 오류가 발생했습니다.");
      }

      return [];
    }
  };

  const onSubmit = async (data: {
    images: File[];
    title: string;
    contents: string;
  }) => {
    console.log("🔵 onSubmit 함수 실행됨", data);

    try {
      const token = getAccessToken();
      console.log("🟢 토큰 확인:", token);
      if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");

      let imageUrls: string[] = [];
      if (data.images.length > 0) {
        imageUrls = (await uploadImages(data.images)) || [];
      }

      console.log("📸 업로드된 이미지 URLs:", imageUrls);

      const payload = {
        title: data.title,
        contents: data.contents,
        images: imageUrls.length > 0 ? imageUrls : [], // ✅ 빈 배열이면 빈값 유지
      };

      console.log("📨 전송할 데이터:", payload);

      const response = await fetch("/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("✅ 서버 응답 수신 완료!");
      console.log("서버 응답 상태 코드:", response.status);
      console.log("서버 응답 헤더:", response.headers.get("content-type"));

      const responseText = await response.text();
      console.log("서버 응답 원본:", responseText);

      let responseData;
      try {
        responseData = responseText.startsWith("{")
          ? JSON.parse(responseText)
          : { message: responseText };
        console.log("서버 응답 JSON:", responseData);
      } catch (jsonError) {
        console.error("❌ JSON 변환 실패:", jsonError);
        throw new Error("서버 응답이 JSON 형식이 아닙니다.");
      }

      if (!response.ok) {
        throw new Error(responseData.message || "게시글 등록 실패");
      }

      console.log("✅ 성공적으로 등록됨:", responseData);
      alert(responseData.message || "게시글이 등록되었습니다!");
      router.push("/communityBoard");
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ 게시글 등록 실패:", error.message);
        alert("게시글 등록에 실패했습니다. 오류 메시지: " + error.message);
      } else {
        console.error("❌ 게시글 등록 실패: 알 수 없는 오류", error);
        alert("게시글 등록에 실패했습니다. 알 수 없는 오류 발생");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6 flex-1">
        <div>
          <label className="block text-sm text-text-primary mb-1">제목</label>
          <Input
            type="text"
            placeholder="제목을 입력해주세요"
            className="w-full"
            value={inputValue} // ✅ 추가
            {...register("title", {
              onChange: (e) => setInputValue(e.target.value), // ✅ setValue 제거하고 여기서 직접 상태 업데이트
            })}
          />

          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-primary mb-1">
            상세 내용
          </label>
          <textarea
            placeholder="내용을 입력해주세요"
            className="resize-none flex w-full h-[13rem] px-4 py-4 items-center gap-2 self-stretch rounded-xl border focus:border-[rgba(27,141,90,0.93)] focus:outline-none"
            {...register("contents")}
          />
          {errors.contents && (
            <p className="text-red-500 text-sm">{errors.contents.message}</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            사진 첨부
          </label>

          <div className="flex gap-4 flex-wrap">
            <div
              className="w-[100px] h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={appnedImg}
            >
              <Image
                src="/icons/camera.png"
                alt="Upload Image"
                width={40}
                height={40}
              />
            </div>

            {previewImages.map((imgSrc, index) => (
              <div key={index} className="w-[100px] h-[100px] relative group">
                <Image
                  src={imgSrc}
                  alt={`preview-${index}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <Button
            type="submit"
            design="design1"
            width="full"
            className="h-[3.5rem]"
          >
            등록하기
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommunityBoardNew;
