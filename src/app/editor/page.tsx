import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EditorPageClient } from "@/components/editor/EditorPageClient";
import { requireAuthenticatedMember } from "@/lib/auth/guards";

export default async function EditorPage() {
  const { profile } = await requireAuthenticatedMember();

  return (
    <AuthGuard>
      <Suspense fallback={<EditorLoadingFallback />}>
        <EditorPageClient profile={profile} />
      </Suspense>
    </AuthGuard>
  );
}

function EditorLoadingFallback() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-line bg-card px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-muted">正在載入編輯器...</p>
      </div>
    </main>
  );
}
