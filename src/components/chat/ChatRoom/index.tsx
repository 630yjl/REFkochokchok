/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Image from "next/image";
import Button from "@/commons/Button";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/commons/input";
import { useUserStore } from "@/commons/store/userStore";
import axiosInstance from "@/utils/axiosInstance";

interface Message {
  createdAt?: string;
  writeUserName?: string;
  message: string;
  chatRoomId: any;
  type: string; // 메시지 타입 ('text' 또는 'system')
  text?: string; // 일반 메시지 내용
  time?: string; // 시간 지울예정
  sender?: string; // 발신자 지울예정
  senderId?: number; // 발신자ID 지울예정
  writeUserProfileImage?: string;
  writeUserId?: number | undefined;
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]); // 채팅 메시지 상태
  const [inputValue, setInputValue] = useState(""); // 입력 필드 상태
  const [detail, setDetail] = useState(false); // 상세 버튼 (숨김 상태)
  const inputRef = useRef<HTMLInputElement>(null); // 입력 필드 DOM에 접근하기 위한 ref
  const messagesEndRef = useRef<HTMLDivElement>(null); // 채팅 메시지 목록의 끝을 참조하는 ref
  const router = useRouter(); // useRouter 훅 사용
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId"); // ✅ URL에서 roomId 가져오기
  const postId = searchParams.get("postId"); // 해당 게시물의 ID
  const title = searchParams.get("title");
  const price = searchParams.get("price");
  const imageUrl = searchParams.get("imageUrl"); // 해당 게시물의 썸네일
  const tradeUserId = searchParams.get("tradeUserId") || ""; // 게시글 올린 유저의 ID
  const tradeUserImage = searchParams.get("tradeUserImage") || ""; // 게시글 올린 유저의 프사
  const user = useUserStore((state) => state.user) ?? { name: "", id: 0 }; // 로그인한 유저정보 가져옴
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    console.log("📡 WebSocket 연결 시도 중...");
    console.log("🔍 구독하는 roomId 타입:", typeof roomId, roomId);

    const socket = new SockJS("http://3.36.40.240:8001/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000, // 5초마다 자동 재연결
      onConnect: () => {
        console.log("✅ WebSocket 연결 성공!");

        // 3️⃣ (메시지 수신 설정)
        stompClient.subscribe(`/topic/chat/${Number(roomId)}`, (message) => {
          try {
            console.log("📩 메시지 수신됨:", message.body); // 메시지가 도착하는지 확인
            const receivedMessage = JSON.parse(message.body);
            console.log("✅ 파싱된 메시지:", receivedMessage);

            // 상태 업데이트 전 콘솔 출력
            console.log("🛠 기존 messages 상태:", messages);

            setMessages((prevMessages) => {
              console.log("📌 업데이트될 messages 상태:", [
                ...prevMessages,
                receivedMessage,
              ]);
              return [...prevMessages, receivedMessage];
            });
          } catch (error) {
            console.error("🚨 메시지 파싱 오류:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("🚨 STOMP 오류 발생:", frame);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) {
        console.log("🛑 WebSocket 연결 해제");
        stompClientRef.current.deactivate();
      }
    };
  }, [roomId]);

  // API를 요청해서 해당방의 이전 메세지 기록을 불러옴
  useEffect(() => {
    axiosInstance
      .get(`/api/trade/${postId}/chat-rooms/${roomId}/messages`)
      .then((response) => {
        setMessages(response.data.reverse()); // ✅ 최신 메시지가 아래로 정렬되도록 수정
      })
      .catch((error) =>
        console.error("채팅 내역 불러오기 실패:", error.message)
      );
  }, [roomId]);

  // ✅ 메시지 전송하는 경우
  const sendMessage = () => {
    if (!inputValue.trim()) return; // 빈 메세지 방지

    const chatMessage: Message = {
      chatRoomId: Number(roomId), // ✅ 문자열이 아니라 숫자로 변환

      type: "TEXT", // 메세지 타입
      message: inputValue, // 메세지 내용

      writeUserName: user?.name ?? "", // 현재 로그인 사용자 이름
      writeUserProfileImage: "",
      writeUserId: user?.id,
      createdAt: "",
    };
    console.log("📤 메시지 전송:", chatMessage);

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat/send", // 🔥 이 부분이 서버에서 받는 경로야
        body: JSON.stringify(chatMessage),
      });
      console.log("✅ 메시지 전송 성공!");
    } else {
      console.error("🚨 WebSocket 연결 안됨! 메시지 전송 실패");
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  // 산책 승인 메시지 전송하는 경우  - 메세지만 어떻게 나오게 시도하기 그럼 이거도 끝남
  const onClickApprove = () => {
    const walkMessage: Message = {
      chatRoomId: Number(roomId),
      type: "LOCATION",
      message: "산책을 시작하려 해요!\n우리 반려동물의 위치를 확인해 보세요!",

      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      writeUserId: user?.id,
    };

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat/send", // 🔥 이 부분이 서버에서 받는 경로야
        body: JSON.stringify(walkMessage),
      });
      console.log("✅ 메시지 전송 성공!");
    } else {
      console.error("🚨 WebSocket 연결 안됨! 메시지 전송 실패");
    }
  };

  // 이미지 함수 들어가는 부분
  // const onClickImage = () => {
  //   const imageMessage: Message = {};
  // };

  // ✅ 채팅방 하단 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 더보기 올리기
  const onClickDetailBtn = () => {
    setDetail((prev) => !prev); // 현재 상태를 반대로 변경 (토글 기능)
  };

  // 지도 페이지로 이동
  const onClickMap = () => {
    router.push("/map");
  };

  console.log("📌 현재 방 정보:", {
    roomId,
    title,
    price,
    imageUrl,
    tradeUserId,
    postId,
  });

  return (
    <main className="flex flex-col h-[94dvh] max-h-[94dvh] overflow-hidden text-[#26220D] font-suit text-base">
      <section className="px-8 py-2 border-t border-b border-gray-300 mb-4">
        <div className="flex">
          <div
            className="w-12 h-12 mr-2 rounded-2xl bg-center bg-cover bg-no-repeat flex-shrink-0"
            style={{
              backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
              backgroundColor: imageUrl ? "transparent" : "#d3d3d3",
            }}
          ></div>
          <div className="w-full">
            <div className="flex justify-between">
              <span className="max-w-[250px] truncate">{title}</span>
              <span className="font-extrabold">게시중</span>{" "}
              {/* 나중에 게시 완료 이런식으로 바뀌는 로직 추가해야함. */}
            </div>
            <div>
              <span className="font-extrabold">
                {price === "가격 미정" ? 0 : price} 원
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 채팅 메시지 목록 */}
      <section className="mb-[8px] mx-4 flex flex-col items-start gap-6 overflow-y-auto flex-1">
        {messages.map((message, index) => {
          return (
            <div
              key={index}
              className={`w-full flex ${
                (message.sender || message.writeUserName) === user.name
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* 📌 LOCATION 타입 메시지 */}
              {message.type === "LOCATION" && (
                <div className="flex flex-col w-full">
                  <div className="w-full min-h-[120px] flex flex-col p-2 px-5 items-start gap-4 self-stretch border-l-[2.5px] border-[#72C655]">
                    <div className="flex flex-col self-stretch text-[#26220D] font-suit text-base font-medium leading-[1.5rem] tracking-[-0.025rem]">
                      {message.message.split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                    <Button design="design2" onClick={onClickMap}>
                      <Image
                        className="mr-1"
                        src="/icons/chat_location_icon_20px.svg"
                        alt="location Icon"
                        width={20}
                        height={20}
                      />
                      위치 확인하기
                    </Button>
                  </div>
                  {message.createdAt && (
                    <span className="flex items-end min-w-[3.8125rem] mt-4 mr-[5px] text-[#8D8974] text-center text-sm font-medium leading-5 tracking-[-0.01875rem]">
                      {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              )}

              {/* 여기에 IMAGE 타입 들어갈 예정 */}

              {/* 📌 TEXT 타입 메시지 */}
              {/* 📌 TEXT 타입 메시지 */}
              {message.type === "TEXT" && (
                <>
                  {/* 내가 보낸 메시지라면 시간 왼쪽 */}
                  {(message.sender || message.writeUserName) === user.name &&
                    message.createdAt && (
                      <span className="flex items-end min-w-[3.8125rem] mr-[5px] text-[#8D8974] text-center text-sm font-medium leading-5 tracking-[-0.01875rem]">
                        {new Date(message.createdAt).toLocaleTimeString(
                          "ko-KR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    )}

                  {/* 상대 아이콘 */}
                  {(message.sender || message.writeUserName) !== user.name && (
                    <div
                      className="w-[40px] h-[40px] mr-2 rounded-3xl bg-center bg-cover bg-no-repeat flex-shrink-0"
                      style={{
                        backgroundColor: "#d3d3d3",
                      }}
                    ></div>
                  )}

                  <div
                    className={`max-w-[79%] px-3 py-2 ${
                      (message.sender || message.writeUserName) === user.name
                        ? "bg-[#E9E8E3] rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-none"
                        : "bg-[#BFE5B3] rounded-tl-none rounded-tr-lg rounded-bl-lg rounded-br-lg"
                    } text-[#26220D] text-base font-medium leading-6 tracking-[-0.025rem]`}
                  >
                    {message.text || message.message}
                  </div>

                  {/* 상대가 보낸 메세지라면 시간 오른쪽 */}
                  {(message.sender || message.writeUserName) !== user.name &&
                    message.createdAt && (
                      <span className="flex items-end min-w-[3.8125rem] ml-[5px] text-[#8D8974] text-center text-sm font-medium leading-5 tracking-[-0.01875rem]">
                        {new Date(message.createdAt).toLocaleTimeString(
                          "ko-KR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          );
        })}
      </section>

      {/* 버튼 클릭 시 div가 나타나도록 설정 */}
      {detail && (
        <div className="flex w-full px-5 pb-5 pt-0 flex-col items-center rounded-t-[1.75rem] bg-[#FDFCF8]">
          <div className="w-1/6 h-[0.25rem] rounded-[6.25rem] bg-[#BBB8AB] my-4">
            {/* 바 */}
          </div>
          <div className="flex w-full gap-3 ">
            {/* 사진 보내기 */}
            <Image
              // onClick={onClickImage} - 나중에 사용
              className=""
              src="/images/chat_image_upload_btn_img_44px.svg"
              alt="send Icon"
              width={44}
              height={44}
            />

            {/* 산책 시작하기 */}
            {Number(tradeUserId) === user.id && (
              <Image
                onClick={onClickApprove}
                className=""
                src="/images/chat_walking_dog_outside_BTN_44px.svg"
                alt="send Icon"
                width={44}
                height={44}
              />
            )}
          </div>
        </div>
      )}

      <footer className="w-full">
        {/* 입력 필드 및 버튼 */}
        <div className="flex w-full items-end flex-shrink-0">
          <div className="mx-0 flex justify-between p-4 items-center gap-2 w-full bg-[#FDFCF8]">
            <div className="min-w-[3rem] h-full" onClick={onClickDetailBtn}>
              <Image
                src={
                  detail
                    ? "/images/chat_collapse_BTN_44px.svg"
                    : "/images/chat_expand_BTN_44px.svg"
                }
                alt="photo Icon"
                width={44}
                height={44}
              />
            </div>

            <div className="w-full">
              <Input
                ref={inputRef}
                className="w-full max-h-[3rem] flex items-center gap-2 rounded-[5rem] border border-[#BBB8AB] bg-[#F4F3F1] text-base font-medium leading-[1.5rem] tracking-[-0.025rem]"
                placeholder="메세지를 입력해주세요."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div className="min-w-[3rem] h-full" onClick={sendMessage}>
              <Image
                src="/images/chat_send_btn_img_44px.svg"
                alt="send Icon"
                width={44}
                height={44}
              />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
