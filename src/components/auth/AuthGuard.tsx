"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseBrowserClient();

    if (!client) {
      router.replace("/login");
      return;
    }

    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setStatus("ready");
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (status !== "ready") {
    return (
      <div className="rounded-[28px] border border-line bg-card px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-muted">正在確認登入狀態...</p>
      </div>
    );
  }

  return <>{children}</>;
}
