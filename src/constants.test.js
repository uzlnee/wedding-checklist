import { phaseDate, PHASES, CATS, seedItems, makeCode, splitDate, composeDate } from "./constants";

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

test("makeCode는 6자리 대문자/숫자 코드를 만든다", () => {
  for (let i = 0; i < 100; i++) {
    expect(makeCode()).toMatch(/^[A-Z0-9]{6}$/);
  }
});

test("splitDate는 YYYY-MM-DD를 년/월/일로 분리하고 앞자리 0을 뗀다", () => {
  expect(splitDate("2026-10-05")).toEqual({ y: "2026", m: "10", d: "5" });
});

test("splitDate는 형식이 아니면 빈 값", () => {
  expect(splitDate("")).toEqual({ y: "", m: "", d: "" });
  expect(splitDate("2026/10/05")).toEqual({ y: "", m: "", d: "" });
});

test("composeDate는 유효한 날짜를 YYYY-MM-DD로 만든다", () => {
  expect(composeDate("2026", "10", "5")).toBe("2026-10-05");
  expect(composeDate(2026, 1, 1)).toBe("2026-01-01");
});

test("composeDate는 잘못된/존재하지 않는 날짜에 null", () => {
  expect(composeDate("2026", "13", "1")).toBeNull(); // 13월
  expect(composeDate("2026", "2", "30")).toBeNull(); // 2월 30일 없음
  expect(composeDate("", "10", "5")).toBeNull();     // 연도 비어 있음
});
