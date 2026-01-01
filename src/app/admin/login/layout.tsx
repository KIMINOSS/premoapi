// 관리자 로그인 페이지는 사이드바 없이 표시
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
