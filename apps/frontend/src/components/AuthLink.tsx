"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { getAuthToken } from "@/lib/auth-storage";

export default function AuthLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (token) {
      router.push(href);
    } else {
      // redirect to signup first; preserve target to navigate after auth
      const next = encodeURIComponent(href);
      router.push(`/signup?next=${next}`);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
