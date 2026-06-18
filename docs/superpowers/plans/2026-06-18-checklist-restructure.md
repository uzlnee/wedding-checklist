# 웨딩 체크리스트 항목·시기 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 종이 체크리스트(상견례~D-1 8단계)를 기존 앱에 병합 — 시기 8단계 재구성, 카테고리 2개 신설, 항목 약 47개로 재작성.

**Architecture:** 데이터는 `src/constants.js`(CATS·PHASES·seedItems)에 모여 있고, 화면 3탭은 `src/App.jsx` 단일 파일. 시기 계산 로직을 순수 함수 `phaseDate`로 추출해 단위 테스트하고, 일정 탭은 이 함수를 사용하도록 바꾼다. 데이터 변경(상수·시드)이 대부분이라 변경 범위가 좁다.

**Tech Stack:** React 18 + Create React App(react-scripts 5). 테스트는 react-scripts에 번들된 Jest.

## Global Constraints

- 기존 데이터 모델 유지: 각 항목은 `{ id, cat, emoji, title, value, status, budget, memo, phase, tip }`.
- `status` 값은 `"todo" | "inprogress" | "done"` 세 가지만 사용.
- 카테고리는 `CATS` 배열의 문자열과 **정확히 일치**해야 하고, 항목의 `phase`는 `PHASES`의 `id` 중 하나여야 한다.
- 범용 템플릿이므로 시드 항목의 `value`는 빈 문자열, `status`는 `"todo"`로 둔다(특정 업체명 하드코딩 금지).
- 기존 룸 데이터는 마이그레이션하지 않는다(신규 시드는 새 룸에만 적용). 이 한계를 코드 주석/커밋 메시지로 남기지 않아도 되나, 임의 마이그레이션 코드는 작성하지 않는다.

---

## File Structure

- `src/constants.js` — 수정: `CATS`(2개 추가), `PHASES`(8단계 재정의, 월=`m`/일=`d` 오프셋), `seedItems`(약 47개 재작성), 신규 순수 함수 `phaseDate`.
- `src/constants.test.js` — 생성: `phaseDate` 및 시드 무결성 단위 테스트.
- `src/App.jsx` — 수정: `TimelineView`의 인라인 날짜 계산을 `phaseDate`로 교체하고 일 단위 단계 라벨 분기 추가.
- `package.json` — 수정: `test` 스크립트 추가.

---

## Task 1: 시기 모델 + `phaseDate` 순수 함수 (TDD)

**Files:**
- Modify: `package.json` (scripts)
- Modify: `src/constants.js` (PHASES 재정의, phaseDate 추가)
- Test: `src/constants.test.js`

**Interfaces:**
- Produces:
  - `PHASES`: `Array<{ id: string, when: string, sub: string, m?: number, d?: number }>` — 각 원소는 `m`(예식 N개월 전) **또는** `d`(예식 N일 전) 중 하나를 가진다.
  - `phaseDate(weddingDate: string, phase: {m?: number, d?: number}): Date` — `weddingDate`("YYYY-MM-DD")에서 phase 오프셋만큼 뺀 Date를 반환. `phase.d`가 있으면 일 단위, 없으면 월 단위로 뺀다.

- [ ] **Step 1: `package.json`에 test 스크립트 추가**

`scripts`에 한 줄 추가 (기존 start/build 유지):

```json
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/constants.test.js` 생성:

```js
import { phaseDate, PHASES } from "./constants";

test("월 단위 단계는 개월 수만큼 뺀다", () => {
  const d = phaseDate("2026-12-25", { m: 6 });
  expect(d.getFullYear()).toBe(2026);
  expect(d.getMonth()).toBe(5); // 6월 (0-indexed)
  expect(d.getDate()).toBe(25);
});

test("일 단위 단계는 일수만큼 뺀다 (2주 전)", () => {
  const d = phaseDate("2026-12-25", { d: 14 });
  expect(d.getMonth()).toBe(11); // 12월
  expect(d.getDate()).toBe(11);
});

test("D-1은 하루를 뺀다", () => {
  const d = phaseDate("2026-12-25", { d: 1 });
  expect(d.getMonth()).toBe(11);
  expect(d.getDate()).toBe(24);
});

test("PHASES는 8단계이고 각 단계는 m 또는 d 중 하나만 갖는다", () => {
  expect(PHASES).toHaveLength(8);
  for (const p of PHASES) {
    const hasM = p.m != null;
    const hasD = p.d != null;
    expect(hasM !== hasD).toBe(true); // 정확히 하나
  }
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: FAIL — `phaseDate is not a function` 및 PHASES 단계 수/구조 불일치.

- [ ] **Step 4: `src/constants.js`의 PHASES 재정의 + phaseDate 추가**

기존 `PHASES` 배열(6단계)을 아래 8단계로 **교체**:

```js
export const PHASES = [
  { id:"p1", m:12, when:"상견례",              sub:"양가 첫 만남을 준비해요" },
  { id:"p2", m:9,  when:"결혼 준비 시작",       sub:"홀·스드메·예물을 계약해요" },
  { id:"p3", m:6,  when:"웨딩데이 6~5개월 전",  sub:"가봉·스튜디오 촬영을 진행해요" },
  { id:"p4", m:4,  when:"웨딩데이 4~3개월 전",  sub:"청첩장·인력·피부관리를 챙겨요" },
  { id:"p5", m:2,  when:"웨딩데이 2~1개월 전",  sub:"발송·피팅·리허설을 확인해요" },
  { id:"p6", d:14, when:"웨딩데이 2주 전",       sub:"식순을 확정해요" },
  { id:"p7", d:7,  when:"웨딩데이 1주 전",       sub:"하객 수·사례비를 점검해요" },
  { id:"p8", d:1,  when:"D-1",                  sub:"한복·예복·소품을 마무리해요" },
];
```

`won`/`uid` 정의 위(또는 아래 아무 곳)에 순수 함수 추가:

```js
export const phaseDate = (weddingDate, phase) => {
  const d = new Date(weddingDate + "T00:00:00");
  if (phase.d != null) d.setDate(d.getDate() - phase.d);
  else d.setMonth(d.getMonth() - phase.m);
  return d;
};
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: 커밋**

```bash
git add package.json src/constants.js src/constants.test.js
git commit -m "feat: 시기 8단계 재정의 + phaseDate 순수 함수 (월/일 오프셋)"
```

---

## Task 2: 카테고리 2개 신설 + seedItems 약 47개 재작성 (TDD)

**Files:**
- Modify: `src/constants.js` (CATS, seedItems)
- Test: `src/constants.test.js` (테스트 추가)

**Interfaces:**
- Consumes: `PHASES`(Task 1), `CATS`.
- Produces: `seedItems(): Array<Item>` — 모든 항목의 `cat`은 `CATS`에, `phase`는 `PHASES`의 id에 속하고, `id`는 유일하다.

- [ ] **Step 1: 무결성 테스트 추가 (실패)**

`src/constants.test.js` 맨 아래에 추가:

```js
import { CATS, seedItems } from "./constants";

test("모든 시드 항목은 유효한 카테고리와 단계를 갖는다", () => {
  const catSet = new Set(CATS);
  const phaseSet = new Set(PHASES.map((p) => p.id));
  for (const it of seedItems()) {
    expect(catSet.has(it.cat)).toBe(true);
    expect(phaseSet.has(it.phase)).toBe(true);
  }
});

test("시드 항목 수는 47개", () => {
  expect(seedItems()).toHaveLength(47);
});

test("시드 항목 id는 모두 유일하다", () => {
  const ids = seedItems().map((i) => i.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("신설 카테고리 2개가 포함된다", () => {
  expect(CATS).toContain("피부·뷰티");
  expect(CATS).toContain("신혼 살림");
});
```

> 참고: `import { phaseDate, PHASES } ...`에 `CATS, seedItems`를 합쳐 한 줄로 정리해도 되고, 위처럼 별도 import 줄을 추가해도 Jest는 동일 모듈을 중복 없이 처리한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: FAIL — 항목 수 26 ≠ 47, 신설 카테고리 없음.

- [ ] **Step 3: CATS에 카테고리 2개 추가**

`src/constants.js`의 `CATS`를 아래로 교체:

```js
export const CATS = [
  "예식장·플래너","스드메","본식 촬영·영상","예물·부케",
  "한복·혼주","청첩장","식순·인력","가족 행사","신혼여행",
  "피부·뷰티","신혼 살림",
];
```

- [ ] **Step 4: seedItems 전체 재작성**

`src/constants.js`의 `seedItems` 함수를 아래로 **교체**:

```js
export const seedItems = () => [
  // ── p1 · 상견례 ──
  { id:"meetingDate",    cat:"가족 행사",      emoji:"🗓️", title:"상견례 날짜 정하기",        value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"양가 일정을 맞춰 예식 6개월~1년 전에 정해요." },
  { id:"meetingPlace",   cat:"가족 행사",      emoji:"🍽️", title:"상견례 장소(식당) 예약",     value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"웨딩홀과 가까운 곳이면 동선이 편해요." },
  { id:"meetingGift",    cat:"가족 행사",      emoji:"🎁", title:"상견례 선물 준비",          value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"양가 부모님 선물을 미리 준비해요." },
  { id:"meetingPpt",     cat:"가족 행사",      emoji:"📑", title:"상견례 PPT 자료 준비하기",   value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"서로 가족을 소개할 자료를 만들면 분위기가 부드러워요." },
  { id:"meetingDday",    cat:"가족 행사",      emoji:"🤝", title:"상견례 D-Day",             value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"당일 진행 순서와 인사말을 챙겨요." },

  // ── p2 · 결혼 준비 시작 ──
  { id:"weddingcafe",    cat:"예식장·플래너",  emoji:"☕", title:"웨딩 카페 가입",            value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"추천인 코드로 가입 혜택을 받을 수 있어요." },
  { id:"planner",        cat:"예식장·플래너",  emoji:"💛", title:"박람회 또는 플래너 상담",     value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"스드메 계약 전에 정하면 연계 할인을 받기 좋아요." },
  { id:"venue",          cat:"예식장·플래너",  emoji:"🏛️", title:"웨딩홀 투어 & 계약",         value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"날짜·홀·식대를 먼저 확정해야 나머지 일정이 맞춰져요." },
  { id:"sdm",            cat:"스드메",         emoji:"📷", title:"스드메 상담 & 계약",         value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"스튜디오·드레스·메이크업을 함께 상담해요." },
  { id:"dress",          cat:"스드메",         emoji:"👰", title:"결혼식 드레스 투어 & 계약",   value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"드레스 투어는 시간이 걸리니 여유 있게 예약해요." },
  { id:"band",           cat:"예물·부케",      emoji:"💍", title:"웨딩밴드 투어 & 구매",       value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"맞춤 제작은 3~4주 이상 걸려요." },
  { id:"honeymoon",      cat:"신혼여행",       emoji:"🏝️", title:"신혼여행 계약",             value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"성수기·항공권은 빠를수록 저렴해요." },
  { id:"suit",           cat:"스드메",         emoji:"🤵", title:"신랑 예복 투어 & 계약",      value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"맞춤은 가봉까지 한 달 이상 걸려요." },

  // ── p3 · 웨딩데이 6~5개월 전 ──
  { id:"parenthanbok",   cat:"한복·혼주",      emoji:"👘", title:"혼주 한복 & 메이크업 계약",   value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"양가 혼주 의상 톤을 함께 맞춰요." },
  { id:"hanbokbride",    cat:"한복·혼주",      emoji:"👚", title:"신부 한복",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"대여·맞춤 모두 최소 한 달 여유를 둬요." },
  { id:"hanbokgroom",    cat:"한복·혼주",      emoji:"👔", title:"신랑 한복",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"신부 한복과 톤을 맞춰요." },
  { id:"parentsuit",     cat:"한복·혼주",      emoji:"🥻", title:"혼주 정장",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"맞춤·대여 일정을 미리 잡아요." },
  { id:"dressfit",       cat:"스드메",         emoji:"✂️", title:"스튜디오 촬영 드레스 가봉",   value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"촬영 콘셉트에 맞춰 가봉해요." },
  { id:"suitfit",        cat:"스드메",         emoji:"🧵", title:"신랑 예복 가봉",            value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"맞춤 예복은 가봉이 필요해요." },
  { id:"studiohair",     cat:"스드메",         emoji:"💇", title:"스튜디오 헤어변형",         value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"촬영 콘셉트에 맞춰 미리 상담해요." },
  { id:"shootprops",     cat:"예물·부케",      emoji:"🎈", title:"웨딩 촬영용 소품 준비",      value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"부케·풍선 등 촬영 소품을 준비해요." },
  { id:"studioshoot",    cat:"스드메",         emoji:"🎬", title:"스튜디오 촬영 진행",         value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"촬영 당일 일정과 콘셉트를 확인해요." },
  { id:"snap",           cat:"본식 촬영·영상", emoji:"📸", title:"본식 스냅",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"주말 예약이 빨리 차므로 일찍 잡아요." },
  { id:"dvd",            cat:"본식 촬영·영상", emoji:"📹", title:"본식 DVD(영상)",           value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"스냅과 함께 묶으면 비용을 아낄 수 있어요." },
  { id:"airline",        cat:"신혼여행",       emoji:"✈️", title:"신혼여행 항공사",           value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"마일리지·경유까지 비교해 일찍 발권해요." },

  // ── p4 · 웨딩데이 4~3개월 전 ──
  { id:"skincare",       cat:"피부·뷰티",      emoji:"🧴", title:"신랑신부 피부관리 시작",      value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"보톡스·리쥬란·제모·치아미백은 미리 시작해요." },
  { id:"invitation",     cat:"청첩장",         emoji:"💌", title:"모바일 & 종이 청첩장 제작",   value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"예식 4~6주 전 발송을 목표로 제작해요." },
  { id:"mc",             cat:"식순·인력",      emoji:"🎤", title:"사회자 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"식순을 함께 정리할 사회자를 섭외해요." },
  { id:"singer",         cat:"식순·인력",      emoji:"🎼", title:"축가자 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"곡 선정과 연습 일정을 미리 맞춰요." },
  { id:"moneydesk",      cat:"식순·인력",      emoji:"💰", title:"축의대 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"양가 접수·축의대 담당을 정해요." },
  { id:"bouquetgirl",    cat:"식순·인력",      emoji:"👜", title:"부케&가방순이 섭외",        value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"부케·가방을 맡을 사람을 미리 정해요." },
  { id:"appliances",     cat:"신혼 살림",      emoji:"🔌", title:"신혼 가전 계약",            value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"혼수 가전을 비교해 계약해요." },
  { id:"invitationmeet", cat:"청첩장",         emoji:"🥂", title:"청첩장 모임 시작",          value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"지인들과 청첩장 모임 일정을 잡아요." },

  // ── p5 · 웨딩데이 2~1개월 전 ──
  { id:"prevideo",        cat:"본식 촬영·영상", emoji:"🎞️", title:"식전 영상 제작",           value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"본식 전 상영할 영상을 제작해요." },
  { id:"minvitationsend", cat:"청첩장",         emoji:"📧", title:"모바일 청첩장 발송",        value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"약도·계좌·갤러리를 함께 담아 발송해요." },
  { id:"dressfitfinal",   cat:"스드메",         emoji:"👗", title:"본식 드레스 피팅",          value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"본식 전 최종 피팅을 해요." },
  { id:"bouquet",         cat:"예물·부케",      emoji:"💐", title:"본식 부케 주문",            value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"예식 2~3일 전 생화로 주문해요." },
  { id:"rehearsal",       cat:"식순·인력",      emoji:"🎬", title:"본식 리허설 확인(~2주 전)",  value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"음향·조명·꽃장식 요청사항을 정리해요." },
  { id:"phototable",      cat:"본식 촬영·영상", emoji:"🖼️", title:"포토테이블 인화",          value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"예식 1~2주 전 인화해요." },

  // ── p6 · 웨딩데이 2주 전 ──
  { id:"ceremonyorder",  cat:"식순·인력",      emoji:"📋", title:"식순 확정",                value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"사회자와 식순을 최종 확정해요." },
  { id:"skincaution",    cat:"피부·뷰티",      emoji:"🚫", title:"다운타임 있는 피부관리 금지", value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"멍·부기·열감이 오르는 시술은 절대 금지예요." },
  { id:"iphone",         cat:"본식 촬영·영상", emoji:"📱", title:"아이폰 스냅(하객 담당)",     value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"하객 스냅 담당을 미리 정해요." },

  // ── p7 · 웨딩데이 1주 전 ──
  { id:"guestcount",     cat:"식순·인력",      emoji:"👥", title:"하객 수 최종 점검",         value:"", status:"todo", budget:"", memo:"", phase:"p7", tip:"식대·좌석을 위해 최종 인원을 확인해요." },
  { id:"giftenvelope",   cat:"식순·인력",      emoji:"✉️", title:"사례비 봉투 준비",          value:"", status:"todo", budget:"", memo:"", phase:"p7", tip:"업체를 쓰지 않는 경우 봉투를 미리 준비해요." },

  // ── p8 · D-1 ──
  { id:"hanbokpickup",   cat:"한복·혼주",      emoji:"👘", title:"혼주 한복 픽업",            value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"예식 전날 한복을 찾아와요." },
  { id:"suitpickup",     cat:"스드메",         emoji:"🤵", title:"신랑 예복 픽업",            value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"예식 전날 예복을 찾아와요." },
  { id:"shoesprops",     cat:"예물·부케",      emoji:"👠", title:"웨딩 슈즈·부케 등 소품 준비", value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"슈즈·부케·소품을 미리 챙겨 둬요." },
];
```

> 항목 수 검산: p1=5, p2=8, p3=12, p4=8, p5=6, p6=3, p7=2, p8=3 → **합계 47**.

- [ ] **Step 5: 테스트 통과 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: PASS (Task 1의 4개 + Task 2의 4개 = 8 tests).

- [ ] **Step 6: 커밋**

```bash
git add src/constants.js src/constants.test.js
git commit -m "feat: 카테고리 2개 신설 + 시드 항목 47개로 재구성"
```

---

## Task 3: 일정 탭이 `phaseDate`를 사용하도록 수정 + 빌드/수동 검증

**Files:**
- Modify: `src/App.jsx` (import 줄, `TimelineView` 날짜 계산)

**Interfaces:**
- Consumes: `phaseDate`, `PHASES`(Task 1), `CATS`(Task 2).

- [ ] **Step 1: App.jsx import에 phaseDate 추가**

`src/App.jsx:3`을 아래로 교체:

```js
import { C, STATUS, CATS, PHASES, phaseDate, won, uid, seedItems } from "./constants";
```

- [ ] **Step 2: TimelineView의 날짜 계산 블록 교체**

`src/App.jsx`의 `TimelineView` 안, `if (weddingDate) { ... }` 블록(현재 `const pd = new Date(...); pd.setMonth(...)` 부분)을 아래로 교체:

```js
        let calLabel=null, calStyle={};
        if (weddingDate) {
          const pd = phaseDate(weddingDate, phase);
          const label = phase.d != null
            ? `${pd.getMonth()+1}월 ${pd.getDate()}일`
            : `${pd.getFullYear()}년 ${pd.getMonth()+1}월`;
          if (allDone)       { calLabel=`✓ 완료`;                    calStyle={background:C.greenBg,color:C.green}; }
          else if (today>pd) { calLabel=`⏳ ${label} · 지금 챙겨요`;  calStyle={background:C.amberBg,color:C.amber}; }
          else               { calLabel=`🗓 ${label}부터`;            calStyle={background:C.greyBg, color:C.t700};  }
        }
```

(월 단위 단계는 기존과 동일하게 "YYYY년 M월", 일 단위 단계(p6~p8)는 "M월 D일"로 표시된다.)

- [ ] **Step 3: 프로덕션 빌드 통과 확인**

Run: `npm run build`
Expected: `Compiled successfully` (경고는 무방, 에러 없음).

- [ ] **Step 4: 수동 스모크 점검**

Run: `npm start` 후 브라우저에서 확인:
- 새 체크리스트 생성 → 체크리스트 탭에 **11개 카테고리**가 그룹으로 나타나고 항목이 47개인지 (준비 현황의 "전체 47개").
- 헤더에서 예식일을 설정 → 일정 탭에서 p1~p5는 "YYYY년 M월", p6(2주 전)·p7(1주 전)·p8(D-1)은 "M월 D일"로 추천 시기가 표시되는지.
- 예산 탭 → 항목에 예산 입력 시 신설 카테고리(피부·뷰티/신혼 살림)도 분류별 지출에 합산되는지.

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: 일정 탭 시기 계산을 phaseDate로 교체(월/일 단위 라벨)"
```

---

## Self-Review (작성자 점검 완료)

- **Spec coverage:** 시기 8단계(Task 1) · 카테고리 11개(Task 2) · 항목 47개(Task 2) · 일정 탭 일 단위 계산(Task 3) · 단계 분할(드레스/예복/혼주한복/청첩장은 seedItems에 반영) — 모두 태스크에 대응.
- **Placeholder scan:** 모든 코드 블록은 실제 내용 포함, TBD/TODO 없음.
- **Type consistency:** `phaseDate(weddingDate, phase)` 시그니처가 Task 1 정의와 Task 3 사용처에서 일치. `phase.d != null` 분기 기준 동일. 항목 객체 키는 Global Constraints의 10개 키와 일치.
- **마이그레이션:** 의도적으로 코드 미작성(스펙 명시) — 기존 룸은 옛 데이터 유지.
