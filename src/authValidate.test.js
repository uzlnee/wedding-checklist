import { validateCredentials } from "./authValidate";

test("정상 입력이면 null", () => {
  expect(validateCredentials("a@b.com", "secret1")).toBeNull();
});

test("이메일에 @가 없으면 에러 문구", () => {
  expect(validateCredentials("abc", "secret1")).toMatch(/이메일/);
});

test("빈 이메일이면 에러 문구", () => {
  expect(validateCredentials("", "secret1")).toMatch(/이메일/);
});

test("비밀번호가 6자 미만이면 에러 문구", () => {
  expect(validateCredentials("a@b.com", "123")).toMatch(/비밀번호/);
});
