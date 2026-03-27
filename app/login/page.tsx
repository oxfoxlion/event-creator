import { LoginPanel } from "@/components/login-panel";

type LoginPageProps = {
  searchParams: Promise<{
    redirect_to?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginPanel redirectTo={params.redirect_to} />;
}
