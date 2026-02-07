import { type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import Offline from "@/pages/Offline";

export function OnlineGuard({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();

  if (!isOnline) return <Offline />;
  return <>{children}</>;
}
