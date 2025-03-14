/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "../store/userStore";

// 위치 정보를 나타내는 인터페이스
interface ILocation {
  latitude: number;
  longitude: number;
}

// API에서 받아오는 게시물 데이터 인터페이스
interface IBoardData {
  writeUserId: number;
}

// KakaoMapComponent에 전달할 prop 타입 (boardId, walkEnded, isWalking)
interface KakaoMapComponentProps {
  boardId: string;
  walkEnded: boolean;
  isWalking: boolean;
}

// Kakao Map SDK에 대한 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMapSocketComponent: React.FC<KakaoMapComponentProps> = ({
  boardId,
  walkEnded,
  isWalking,
}) => {
  const [boardData, setBoardData] = useState<IBoardData | null>(null);
  const [locationData, setLocationData] = useState<ILocation[]>([]);
  const [userLocation, setUserLocation] = useState<ILocation | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  // watchPosition ID를 저장할 ref
  const watchIdRef = useRef<number | null>(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  const lastUpdateRef = useRef<number>(0);
  const initialAutoCenterDoneRef = useRef(false);

  const loggedInUserId = useUserStore((state) => state.user?.id);

  // 1. 게시물 데이터 조회
  useEffect(() => {
    if (!boardId) {
      console.error("🚨 boardId 값이 없습니다. API 요청을 중단합니다.");
      return;
    }
    const token = localStorage.getItem("token-storage")
      ? JSON.parse(localStorage.getItem("token-storage")!)
      : null;
    const fetchBoardData = async () => {
      try {
        console.log("[DEBUG] Fetching board data for boardId:", boardId);
        const response = await fetch(`/api/trade/${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: IBoardData = await response.json();
        console.log("[DEBUG] Board data fetched:", data);
        setBoardData(data);
      } catch (error) {
        console.error("[DEBUG] Error fetching board data:", error);
      }
    };
    fetchBoardData();
  }, [boardId]);

  // 2. Kakao 지도 SDK 로드 및 초기화
  useEffect(() => {
    if (!window.kakao) {
      console.log("[DEBUG] Kakao Maps SDK not found, loading script...");
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      document.head.appendChild(script);
      script.onload = () => {
        console.log("[DEBUG] Kakao Maps SDK loaded");
        window.kakao.maps.load(() => {
          if (boardData) {
            if (loggedInUserId !== boardData.writeUserId) {
              console.log(
                "[DEBUG] Role: 산책 알바생 - fetching initial location"
              );
              getInitialLocation();
            } else {
              console.log(
                "[DEBUG] Role: 게시물 작성자 - setting default location"
              );
              setUserLocation({ latitude: 37.5665, longitude: 126.978 });
            }
          }
        });
      };
    } else {
      console.log("[DEBUG] Kakao Maps SDK already loaded");
      window.kakao.maps.load(() => {
        if (boardData) {
          if (loggedInUserId !== boardData.writeUserId) {
            getInitialLocation();
          } else {
            setUserLocation({ latitude: 37.5665, longitude: 126.978 });
          }
        }
      });
    }
  }, [boardData, loggedInUserId, appKey]);

  // 3. 산책 알바생(불일치 사용자)의 초기 위치 설정
  const getInitialLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation을 지원하지 않는 브라우저입니다.");
      setUserLocation({ latitude: 37.5665, longitude: 126.978 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`초기 위치 설정: (${latitude}, ${longitude})`);
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.error("초기 위치 가져오기 실패:", error);
        setUserLocation({ latitude: 37.5665, longitude: 126.978 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // 4. userLocation 상태가 설정되면 Kakao 지도 초기화
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    console.log(
      "[DEBUG] Initializing Kakao Map with userLocation:",
      userLocation
    );
    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(
        userLocation.latitude,
        userLocation.longitude
      ),
      level: 3,
    };
    kakaoMapRef.current = new window.kakao.maps.Map(container, options);
  }, [userLocation]);

  // 5. 소켓 연결 및 게시글 작성자(위치 수신자)의 위치 업데이트 수신 처리
  useEffect(() => {
    if (!boardData) return;
    socketRef.current = io(process.env.NEXT_PUBLIC_SERVER, {
      query: { boardId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current.on("connect", () => {
      console.log("[DEBUG] Socket connected:", socketRef.current?.id);
    });
    socketRef.current.on("connect_error", (err: any) => {
      console.error("[DEBUG] Socket connection error:", err);
    });
    socketRef.current.on("disconnect", () => {
      console.log("[DEBUG] Socket disconnected");
    });
    // 게시글 작성자: 위치 업데이트 이벤트 수신
    if (loggedInUserId === boardData.writeUserId) {
      socketRef.current.on("locationUpdate", (location: ILocation) => {
        console.log("[DEBUG] Received location update from socket:", location);
        setLocationData((prevLocations) => {
          const updatedLocations = [...prevLocations, location];
          updatePolyline(updatedLocations);
          return updatedLocations;
        });
      });
    }
    return () => {
      if (socketRef.current) {
        console.log("[DEBUG] Disconnecting socket...");
        socketRef.current.disconnect();
      }
    };
  }, [boardData, boardId, loggedInUserId]);

  // 6. 산책 알바생(위치 전송자)의 위치 업데이트: isWalking 상태에 따라 geolocation watchPosition 실행
  useEffect(() => {
    if (!boardData) return;
    // 게시글 작성자가 아니라면 (즉, 산책 알바생인 경우)
    if (loggedInUserId === boardData.writeUserId) return;
    if (!navigator.geolocation) {
      console.error("Geolocation을 지원하지 않는 브라우저입니다.");
      return;
    }

    if (isWalking) {
      // 산책 시작 시 위치 업데이트 시작
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastUpdateRef.current < 3000) return;
          lastUpdateRef.current = now;

          const { latitude, longitude } = position.coords;
          const newLocation: ILocation = { latitude, longitude };
          console.log("[DEBUG] 3초마다 위치 업데이트:", newLocation);

          setLocationData((prevLocations) => {
            const newLocations = [...prevLocations, newLocation];
            const recent = newLocations.slice(-3);
            const avgLat =
              recent.reduce((sum, loc) => sum + loc.latitude, 0) /
              recent.length;
            const avgLng =
              recent.reduce((sum, loc) => sum + loc.longitude, 0) /
              recent.length;
            const smoothLocation = { latitude: avgLat, longitude: avgLng };

            updatePolyline([...newLocations.slice(0, -1), smoothLocation]);

            // smoothing 처리된 좌표를 서버에 전송
            if (socketRef.current) {
              socketRef.current.emit("locationUpdate", smoothLocation);
            }

            return [...newLocations.slice(0, -1), smoothLocation];
          });
        },
        (error) => {
          console.error("위치 정보 가져오기 실패:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    } else {
      // 산책 중이 아니면 기존의 watchPosition 제거
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [boardData, loggedInUserId, isWalking]);

  // 7. 산책 종료 시 위치 업데이트 정지
  useEffect(() => {
    if (walkEnded) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log("[DEBUG] 산책 종료로 인해 위치 업데이트 중단");
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("[DEBUG] 산책 종료로 인해 위치 업데이트 소켓 연결 해제");
      }
    }
  }, [walkEnded]);

  // 8. Polyline 업데이트 및 지도 뷰 자동 포커싱
  const updatePolyline = (locations: ILocation[]) => {
    if (!kakaoMapRef.current || locations.length === 0) return;
    const linePath = locations.map(
      (loc) => new window.kakao.maps.LatLng(loc.latitude, loc.longitude)
    );
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    const polyline = new window.kakao.maps.Polyline({
      map: kakaoMapRef.current,
      path: linePath,
      strokeWeight: 10,
      strokeColor: "#FF0000",
      strokeOpacity: 0.7,
      strokeStyle: "solid",
    });
    polylineRef.current = polyline;
    if (!initialAutoCenterDoneRef.current) {
      const bounds = new window.kakao.maps.LatLngBounds();
      linePath.forEach((latLng) => bounds.extend(latLng));
      kakaoMapRef.current.setBounds(bounds);
      initialAutoCenterDoneRef.current = true;
    }
  };

  return (
    <div>
      {!userLocation ? (
        <p>⏳ 위치를 불러오는 중...</p>
      ) : (
        <div
          id="map"
          ref={mapRef}
          style={{ width: "100%", height: "1000px" }}
        ></div>
      )}
    </div>
  );
};

export default KakaoMapSocketComponent;
