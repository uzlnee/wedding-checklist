export function validateCredentials(email, password) {
  if (!email || !email.includes("@")) return "올바른 이메일을 입력해 주세요.";
  if (!password || password.length < 6) return "비밀번호는 6자 이상이어야 해요.";
  return null;
}
