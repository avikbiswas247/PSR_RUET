import ResetPasswordForm from "@/app/reset-password/reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tokenRaw = searchParams.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw ?? "";
  return <ResetPasswordForm token={token} />;
}
