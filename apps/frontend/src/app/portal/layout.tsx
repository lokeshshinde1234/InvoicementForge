import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <div className="portal-mobile min-w-0 overflow-x-hidden">{children}</div>;
}
