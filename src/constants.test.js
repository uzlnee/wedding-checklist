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
