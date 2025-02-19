import { useEffect, useRef, useState } from "react";
import { onSubmitProps } from "./types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";

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
const useJobBoardEdit = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { boardId } = useParams();
  const [existingImages, setExistingImages] = useState<string[]>([]); // 기존 이미지 저장

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<onSubmitProps>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      mainRegion: "",
      subRegion: "",
      price: "",
      contents: "",
      newImages: [],
    },
  });

  // 엑세스 토큰 가져옴
  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  // 기존 등록된 데이터 불러오기
  useEffect(() => {
    const fetchPostData = async () => {
      const token = getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다.");
      if (!boardId) return;
      try {
        const response = await fetch(`/api/trade/${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("게시글을 불러올 수 없습니다.");
        const postData = await response.json();

        const [mainRegion = "", subRegion = ""] = postData.region.split(" ");
        const priceString = String(postData.price ?? "");

        // 기존 데이터 폼에 입력
        setValue("title", postData.title);
        setValue("mainRegion", mainRegion);
        setValue("subRegion", subRegion);
        setValue("price", priceString);
        setValue("contents", postData.contents);
        setExistingImages(postData.images || []);
      } catch (error) {
        console.error(error);
        alert("게시글 불러오기에 실패했습니다.");
      }
    };

    fetchPostData();
  }, [boardId, setValue]);

  const onSubmit = async (data: onSubmitProps) => {
    try {
      const token = getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다.");

      let imageLinks: string[] = [...existingImages];

      // 1. 새로 추가한 이미지가 있으면 업로드 후 기존 이미지와 합침
      if (data.newImages?.length) {
        const formData = new FormData();
        data.newImages.forEach((file) => formData.append("files", file));

        const uploadResponse = await fetch("/api/uploads/multiple", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("이미지 업로드 실패");

        const uploadResult = await uploadResponse.json();
        imageLinks = [...imageLinks, ...uploadResult]; // 기존 이미지 + 새 이미지
      }

      // 2️. 게시글 데이터 구성
      const payload = {
        title: data.title,
        region: `${data.mainRegion} ${data.subRegion}`,
        price: data.price,
        contents: data.contents,
        images: imageLinks,
      };

      const response = await fetch(`/api/trade/${boardId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "수정 실패");
      }

      alert("게시물이 성공적으로 수정되었습니다.");
      router.push("/jobList");
    } catch (error) {
      console.error("요청 에러:", error);
      alert(error instanceof Error ? error.message : "수정에 실패했습니다.");
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

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
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
    existingImages,
    handleRemoveExistingImage,
    watch,
    handleRemoveNewImage,
    fileInputRef,
    handleFileChange,
  };
};

export default useJobBoardEdit;
