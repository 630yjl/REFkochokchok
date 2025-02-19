/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useUserStore } from "../store/userStore";

interface ILocation {
  latitude: number;
  longitude: number;
}

interface IBoardData {
  writeUserId: number;
}

interface ILocationResponse {
  id: number;
  chatRoomId: number;
  latitude: string;
  longitude: string;
  createdAt: string;
}

// 추가된 prop: hasEnded
interface KakaoMapComponentProps {
  isWalking: boolean;
  boardId: string;
  hasEnded: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMapComponent: React.FC<KakaoMapComponentProps> = ({
  isWalking,
  boardId,
  hasEnded,
}) => {
  const chatRoomId = 3;
  const [boardData, setBoardData] = useState<IBoardData | null>(null);
  const [locationData, setLocationData] = useState<ILocation[]>([]);
  const [userLocation, setUserLocation] = useState<ILocation | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  const apiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAccessToken = (): string | null => {
    const tokenStorageStr = localStorage.getItem("token-storage");
    if (!tokenStorageStr) return null;
    const tokenData = JSON.parse(tokenStorageStr);
    return tokenData?.accessToken || null;
  };

  const loggedInUserId = useUserStore((state) => state.user?.id);

  // 게시물 데이터 조회
  useEffect(() => {
    if (!boardId) return;
    const token = getAccessToken();
    const fetchBoardData = async () => {
      try {
        const response = await fetch(`/api/trade/${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data: IBoardData = await response.json();
        setBoardData(data);
      } catch (error) {
        console.error("[DEBUG] Error fetching board data:", error);
      }
    };
    fetchBoardData();
  }, [boardId]);

  // Kakao 지도 SDK 로드 및 초기화
  useEffect(() => {
    if (!window.kakao) {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      document.head.appendChild(script);
      script.onload = () => {
        window.kakao.maps.load(() => {
          if (boardData) {
            if (loggedInUserId !== boardData.writeUserId) {
              getInitialLocation();
            } else {
              setUserLocation({ latitude: 37.5665, longitude: 126.978 });
            }
          }
        });
      };
    } else {
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
  }, [boardData, loggedInUserId]);

  const getInitialLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ latitude: 37.5665, longitude: 126.978 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        setUserLocation({ latitude: 37.5665, longitude: 126.978 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
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

  // API 통신(위치 전송 또는 조회) interval 제어
  useEffect(() => {
    if (!boardData) return;

    // 기존 interval 정리
    if (apiIntervalRef.current) {
      clearInterval(apiIntervalRef.current);
      apiIntervalRef.current = null;
    }

    // hasEnded가 true면 API 통신을 중단함
    if (hasEnded) return;

    if (loggedInUserId !== boardData.writeUserId) {
      // 산책 알바생: isWalking이 true일 때만 POST 실행
      if (isWalking) {
        const postLocation = () => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setLocationData((prev) => {
                const updated = [...prev, { latitude, longitude }];
                updatePolyline(updated);
                return updated;
              });
              fetch(
                `/api/trade/${boardId}/chat-rooms/${chatRoomId}/locations`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAccessToken()}`,
                  },
                  body: JSON.stringify({
                    latitude: String(latitude),
                    longitude: String(longitude),
                  }),
                }
              )
                .then((response) => {
                  if (!response.ok)
                    throw new Error(`HTTP error! Status: ${response.status}`);
                  return response.text();
                })
                .then((data) => console.log("[DEBUG] 위치 POST 응답:", data))
                .catch((error) =>
                  console.error("[DEBUG] 위치 POST 실패:", error)
                );
            },
            (error) => console.error("위치 정보 가져오기 실패:", error),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        };
        postLocation();
        apiIntervalRef.current = setInterval(postLocation, 10000);
      }
    } else {
      // 게시글 작성자: GET 폴링 진행 (hasEnded가 false인 경우에만)
      const getLocations = () => {
        fetch(`/api/trade/${boardId}/chat-rooms/${chatRoomId}/locations`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
        })
          .then((response) => {
            if (!response.ok)
              throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
          })
          .then((data: ILocationResponse[]) => {
            const locations = data.map((item) => ({
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
            }));
            setLocationData(locations);
            updatePolyline(locations);
          })
          .catch((error) => console.error("[DEBUG] 위치 GET 실패:", error));
      };
      getLocations();
      apiIntervalRef.current = setInterval(getLocations, 10000);
    }

    return () => {
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current);
    };
  }, [boardData, loggedInUserId, boardId, chatRoomId, isWalking, hasEnded]);

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
    const bounds = new window.kakao.maps.LatLngBounds();
    linePath.forEach((latLng) => bounds.extend(latLng));
    kakaoMapRef.current.setBounds(bounds);
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

export default KakaoMapComponent;
