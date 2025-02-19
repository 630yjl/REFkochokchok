/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_MAP_SCRIPT_ID = "kakao-map-script";
const KAKAO_MAP_URL = "https://dapi.kakao.com/v2/maps/sdk.js";
const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

const KakaoMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // 강동구 내 도보 가능한 경로 (위도, 경도)
  const pathCoords = [
    { lat: 37.537776, lng: 127.140009 }, // 예시 지점
    { lat: 37.545539, lng: 127.142906 }, // 강동구청
    { lat: 37.5495, lng: 127.1475 }, // 강동구청 인근
    { lat: 37.5482, lng: 127.149 }, // 예시 지점 1
    { lat: 37.547, lng: 127.1505 }, // 예시 지점 2
    { lat: 37.546453, lng: 127.151675 }, // 강동역
    { lat: 37.5455, lng: 127.15 }, // 예시 지점 3
    { lat: 37.544, lng: 127.1485 }, // 예시 지점 4
    { lat: 37.543, lng: 127.147 }, // 예시 지점 5
    { lat: 37.542, lng: 127.1455 }, // 예시 지점 6
    { lat: 37.541, lng: 127.144 }, // 예시 지점 7
    { lat: 37.537776, lng: 127.140009 }, // 예시 지점 8
  ];

  useEffect(() => {
    const loadKakaoMapScript = async () => {
      const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);
      if (!existingScript) {
        return new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.id = KAKAO_MAP_SCRIPT_ID;
          script.src = `${KAKAO_MAP_URL}?appkey=${apiKey}&libraries=services&autoload=false`;
          script.async = true;
          script.onload = () => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => resolve());
            } else {
              reject("Kakao maps SDK failed to load");
            }
          };
          script.onerror = () => reject("Failed to load Kakao Maps script");
          document.head.appendChild(script);
        });
      } else if (window.kakao?.maps) {
        return Promise.resolve();
      } else {
        return Promise.reject("Kakao maps SDK not available");
      }
    };

    const initializeMap = async () => {
      try {
        await loadKakaoMapScript();

        if (!window.kakao?.maps) {
          console.error("Kakao maps SDK not available");
          return;
        }

        if (!mapContainer.current) return;

        // 첫 번째 좌표를 중심으로 설정
        const centerCoords = new window.kakao.maps.LatLng(
          pathCoords[0].lat,
          pathCoords[0].lng
        );

        const options = {
          center: centerCoords,
          level: 5,
        };

        mapInstance.current = new window.kakao.maps.Map(
          mapContainer.current,
          options
        );

        // 빈 폴리라인 생성
        polylineRef.current = new window.kakao.maps.Polyline({
          path: [], // 초기에는 빈 배열
          strokeWeight: 5, // 두께
          strokeColor: "#FF0000", // 선 색깔
          strokeOpacity: 0.8, // 선 불투명도
          strokeStyle: "solid", // 선 스타일
        });

        polylineRef.current.setMap(mapInstance.current);

        // 애니메이션 함수
        const animatePolyline = () => {
          let currentIndex = 0;

          const addPoint = () => {
            if (currentIndex >= pathCoords.length) {
              if (animationRef.current) {
                window.clearInterval(animationRef.current);
              }
              // 마지막 지점에 마커 추가
              new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(
                  pathCoords[pathCoords.length - 1].lat,
                  pathCoords[pathCoords.length - 1].lng
                ),
                map: mapInstance.current,
                title: "도착지점",
              });
              return;
            }

            const currentPath = pathCoords
              .slice(0, currentIndex + 1)
              .map(
                (coord) => new window.kakao.maps.LatLng(coord.lat, coord.lng)
              );

            polylineRef.current.setPath(currentPath);

            currentIndex++;
          };
          animationRef.current = window.setInterval(addPoint, 500);
        };

        animatePolyline();
      } catch (error) {
        console.error("Error initializing Kakao Map:", error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      const script = document.getElementById(KAKAO_MAP_SCRIPT_ID);
      if (script) script.remove();
      mapInstance.current = null;
      polylineRef.current = null;
      if (animationRef.current) {
        window.clearInterval(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100vh", // 전체 화면 높이
        minHeight: "400px", // 최소 높이 설정
      }}
    />
  );
};

export default KakaoMap;
