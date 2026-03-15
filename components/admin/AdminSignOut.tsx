"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminSignOut() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="w-full justify-start gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
