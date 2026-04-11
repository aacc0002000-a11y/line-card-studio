import { SignupForm } from "@/components/auth/SignupForm";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function SignupPage({
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
        <h1 className="mt-3 text-3xl font-semibold text-foreground">建立會員帳號</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          第一版先支援 Email + Password。完成後即可擁有自己的名片後台與名片歸屬。
        </p>

        <div className="mt-6">
          <SignupForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
