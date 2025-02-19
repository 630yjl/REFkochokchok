/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { onSubmitProps } from "./types";
import { useRouter } from "next/navigation";

// 폼 스키마
export const jobFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  mainRegion: z.string().min(1, "지역을 선택해주세요"),
  subRegion: z.string().min(1, "세부 지역을 선택해주세요"),
  price: z
    .string()
    .min(1, "금액을 입력해주세요")
    .regex(/^[0-9,]+$/, "올바른 금액 형식을 입력해주세요"),
  contents: z.string().min(1, "상세 내용을 입력해주세요"),
  newImages: z.array(z.instanceof(File)).optional(),
});

export const useJobBoardNew = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      mainRegion: "",
      subRegion: "",
      price: "",
      contents: "",
      newImages: [] as File[],
    },
  });

  // 엑세스 토큰 가져옴
  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  const onSubmit = async (data: onSubmitProps) => {
    try {
      const token = getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다.");

      let imageLinks: string[] = [];

      // 1️. 이미지 업로드 (성공하면 이미지 URL 배열을 받음)
      if (data.newImages?.length) {
        const formData = new FormData();
        data.newImages.forEach((file) => formData.append("files", file));

        const uploadResponse = await fetch("/api/uploads/multiple", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("이미지 업로드 실패");

        const uploadResult = await uploadResponse.json();
        imageLinks = uploadResult;
      }

      // 2️. 게시글 데이터 구성 (이미지 URL 포함)
      const payload = {
        title: data.title,
        region: `${data.mainRegion} ${data.subRegion}`,
        price: data.price,
        contents: data.contents,
        images: imageLinks,
      };

      // 3️. 최종 게시글 등록 요청 (이미지 포함)
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "등록 실패");
      }

      alert("게시물이 성공적으로 등록되었습니다.");
      router.push("/jobList");
    } catch (error) {
      console.error("요청 에러:", error);
      alert(error instanceof Error ? error.message : "등록에 실패했습니다.");
    }
  };

  // 파일 이름을 sanitize하는 함수
  const sanitizeFileName = (fileName: string): string => {
    // 영문, 숫자, 점(.), 밑줄(_), 대시(-)를 제외한 모든 문자를 언더스코어(_)로 치환
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const sanitizedFiles = fileArray.map((file) => {
        const newName = sanitizeFileName(file.name);
        if (newName !== file.name) {
          return new File([file], newName, { type: file.type });
        }
        return file;
      });
      const existingFiles = watch("newImages") || [];
      setValue("newImages", [...existingFiles, ...sanitizedFiles], {
        shouldValidate: true,
      });
      event.target.value = "";
    }
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveNewImage = (index: number) => {
    const newImages = [...(watch("newImages") || [])];
    newImages.splice(index, 1);
    setValue("newImages", newImages);
  };

  return {
    control,
    errors,
    handleSubmit,
    onSubmit,
    handleOpenFileDialog,
    watch,
    handleRemoveNewImage,
    fileInputRef,
    handleFileChange,
  };
};
