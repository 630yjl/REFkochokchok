"use client";
import Image from "next/image";
import Button from "@/commons/Button";
import Input from "@/commons/input";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// ✅ 기존 게시글 불러오는 API 함수
const getPostById = async (postId: number) => {
  try {
    const token = localStorage.getItem("token-storage")
      ? JSON.parse(localStorage.getItem("token-storage")!).accessToken
      : null;

    if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");

    const response = await fetch(`/api/community/${postId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`게시글 조회 실패: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error("❌ 게시글 조회 실패:", error);
    return null;
  }
};

// Base64 → Blob 변환 함수 추가
const dataURLtoBlob = (dataURL: string) => {
  const mime = dataURL.match(/^data:(.*?);base64,/)?.[1];
  if (!mime) throw new Error("Invalid DataURL");

  const byteString = atob(dataURL.split(",")[1]);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteArray], { type: mime });
};

const uploadImages = async (files: File[]) => {
  try {
    console.log("📤 이미지 업로드 시작...");

    const token = localStorage.getItem("token-storage")
      ? JSON.parse(localStorage.getItem("token-storage")!).accessToken
      : null;

    if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    console.log("📸 전송할 이미지 파일:", formData.getAll("files"));

    const response = await fetch(
      "http://3.36.40.240:8001/api/uploads/multiple",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    console.log("✅ 이미지 업로드 완료! 응답 상태 코드:", response.status);

    if (!response.ok) throw new Error("파일 업로드 실패");

    const data = await response.json();
    console.log("✅ 서버 응답:", data);

    return data; // ✅ 서버에서 받은 이미지 URL 리스트 반환
  } catch (error) {
    console.error("❌ 이미지 업로드 실패:", error);
    alert("이미지 업로드에 실패했습니다.");
    return [];
  }
};

const CommunityBoardEdit = () => {
  const params = useParams();
  const boardId = Number(params?.boardId) || null;
  console.log("📌 현재 postId:", boardId);

  // ✅ 기존 데이터 상태 관리
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 현재 이미지 목록:", images);
  }, [images]);

  // ✅ 기존 게시글 데이터를 가져와서 상태에 저장
  useEffect(() => {
    const loadPost = async () => {
      if (!boardId) return;
      setLoading(true);

      const fetchedPost = await getPostById(boardId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setTitle(fetchedPost.title);
        setContents(fetchedPost.contents);
        console.log("🔍 불러온 게시글 데이터:", fetchedPost);

        if (fetchedPost.images && fetchedPost.images.length > 0) {
          setImages(fetchedPost.images);
        }
      }

      setLoading(false);
    };

    loadPost();
  }, [boardId]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("📸 파일 선택 이벤트 발생"); // ✅ 여기 로그 찍히는지 확인
      console.log("📸 파일 선택됨:", e.target.files); // ✅ 파일 선택 이벤트 확인
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            console.log("📸 새 이미지 추가됨:", reader.result);
            setImages((prevImages) => [...prevImages, reader.result as string]);
          }
        };

        reader.readAsDataURL(file);
      }
    },
    []
  ); // ✅ 의존성 배열을 빈 배열로 설정하여 함수가 재생성되지 않도록 함

  // ✅ 게시글 수정 API 함수 (컴포넌트 내부에서 상태 접근)
  const updatePost = useCallback(async () => {
    try {
      const token = localStorage.getItem("token-storage")
        ? JSON.parse(localStorage.getItem("token-storage")!).accessToken
        : null;

      if (!token) throw new Error("토큰이 없습니다. 로그인이 필요합니다.");
      if (!boardId) throw new Error("게시글 ID를 찾을 수 없습니다.");

      // ✅ 1️⃣ 새로 추가된 Base64 이미지 추출
      const newBase64Images = images.filter((img) =>
        img.startsWith("data:image")
      );

      let uploadedImageUrls: string[] = [];

      // ✅ 2️⃣ Base64 이미지가 있다면 업로드 API 호출
      if (newBase64Images.length > 0) {
        console.log("📤 새 이미지 업로드 중...");

        // ✅ Base64를 Blob으로 변환 후 File 객체 생성
        const imageFiles = newBase64Images.map((base64, index) => {
          const blob = dataURLtoBlob(base64);
          return new File([blob], `uploaded-image-${index}.png`, {
            type: blob.type,
          });
        });

        uploadedImageUrls = await uploadImages(imageFiles); // ✅ 업로드 API 호출
        console.log("✅ 업로드된 이미지 URL:", uploadedImageUrls);
      }

      // ✅ 3️⃣ 기존 이미지 + 새로 업로드된 이미지 URL 합치기
      const existingImageUrls = images.filter(
        (img) => !img.startsWith("data:image")
      );
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];

      console.log("✏️ 최종 수정 요청 데이터:", {
        title,
        contents,
        images: finalImageUrls,
      });

      const response = await fetch(
        `http://3.36.40.240:8001/api/community/${boardId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            contents,
            images: finalImageUrls, // ✅ 최종 이미지 URL 리스트 전달
          }),
        }
      );

      if (!response.ok) throw new Error(`게시글 수정 실패: ${response.status}`);

      console.log("✅ 게시글 수정 성공");
      alert("게시글이 수정되었습니다!");
      router.push(`/communityBoard/${boardId}`);
    } catch (error) {
      console.error("❌ 게시글 수정 실패:", error);
      alert("게시글 수정에 실패했습니다.");
    }
  }, [title, contents, images, boardId]); // ✅ boardId도 포함

  if (loading) {
    return <div className="text-center py-10">⏳ 게시글 불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <form className="p-4 space-y-6 flex-1">
        <div>
          <label className="block text-sm text-text-primary mb-1">제목</label>
          <Input
            type="text"
            placeholder="제목을 입력해주세요"
            className="w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-text-primary mb-1">
            상세 내용
          </label>
          <textarea
            placeholder="내용을 입력해주세요"
            className="resize-none flex w-full h-[13rem] px-4 py-4 items-center gap-2 self-stretch rounded-xl border focus:border-[rgba(27,141,90,0.93)] focus:outline-none"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            사진 첨부
          </label>
          <div className="flex gap-4 flex-wrap">
            {/* 이미지 업로드 버튼 */}
            <label
              htmlFor="file-upload"
              className="w-[100px] h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Image
                src="/icons/camera.png"
                alt="Upload Image"
                width={40}
                height={40}
              />
            </label>

            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              className="opacity-0 absolute w-0 h-0"
              onChange={handleImageUpload}
            />

            {/* 업로드된 이미지 리스트 */}
            {images.map((img, index) => (
              <div
                key={index}
                className="relative w-[100px] h-[100px] rounded-lg overflow-hidden"
              >
                <Image
                  src={img}
                  alt={`이미지 ${index}`}
                  layout="fill"
                  objectFit="cover"
                />
                {/* 삭제 버튼 */}
                <button
                  type="button"
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white transition-opacity flex items-center justify-center"
                  onClick={() =>
                    setImages((prevImages) =>
                      prevImages.filter((_, i) => i !== index)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <Button
            type="button"
            design="design1"
            width="full"
            className="h-[3.5rem]"
            onClick={updatePost} // ✅ 수정 API 실행
          >
            수정하기
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommunityBoardEdit;
