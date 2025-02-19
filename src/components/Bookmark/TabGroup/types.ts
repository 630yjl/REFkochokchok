// src/components/Bookmark/TabGroup/types.ts

/**
 * 탭 타입 정의
 * 관심에서 사용되는 게시글 상태 분류
 */
export type TabType = "찜" | "북마크" ;

/**
 * 게시글 수를 저장하는 Record 타입
 * 각 탭별 게시글 수를 number 타입으로 저장
 */
export type PostCountsType = Record<TabType, number>;

/**
 * TabGroup Props 인터페이스
 * @property {TabType} currentTab - 현재 선택된 탭
 * @property {function} onTabChange - 탭 변경 핸들러 함수
 * @property {PostCountsType} postCounts - 각 탭별 게시글 수
 */
// export interface TabGroupProps {
//   currentTab: TabType;
//   onTabChange: (tab: TabType) => void;
//   // 각 상태별 게시글 수
//   postCounts: Record<TabType, number>;
// }
export interface TabGroupProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  postCounts: PostCountsType;
}

/**
 * 탭 설정 상수
 * 각 탭의 레이블과 값 정의
 */
export const TABS: { label: string; value: TabType }[] = [
  { label: "찜", value: "찜" },
  { label: "북마크", value: "북마크" },
];