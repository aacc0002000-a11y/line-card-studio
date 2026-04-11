import { LoginForm } from "@/components/auth/LoginForm";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const nextPath = params.next || "/dashboard";

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-md rounded-[32px] border border-line bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.24em] text-accent">
          LINE CARD STUDIO
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">會員登入</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          登入後即可進入後台，管理自己的電子名片與發佈狀態。
        </p>

        <div className="mt-6">
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
