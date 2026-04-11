import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MyCardsPageClient } from "@/components/dashboard/MyCardsPageClient";
import { requireAuthenticatedMember } from "@/lib/auth/guards";

export default async function MyCardsPage() {
  const { profile } = await requireAuthenticatedMember();

  return (
    <DashboardShell
      title="我的名片"
      description="這裡只會顯示目前登入者自己的名片，包含草稿與已發佈版本。"
      profile={profile}
    >
      <AuthGuard>
        <MyCardsPageClient profile={profile} />
      </AuthGuard>
    </DashboardShell>
  );
}
