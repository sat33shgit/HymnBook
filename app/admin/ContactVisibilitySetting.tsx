"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function ContactVisibilitySetting({
  initialVisible,
}: {
  initialVisible: boolean;
}) {
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    const previous = visible;
    setVisible(checked);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/site-settings/contact-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: checked }),
      });

      if (!res.ok) {
        throw new Error("Failed to update contact visibility");
      }

      toast.success(
        checked
          ? "Contact page enabled on main site"
          : "Contact page hidden from main site"
      );
    } catch {
      setVisible(previous);
      toast.error("Failed to update contact page visibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Enable Contact Page</span>
      <Switch
        checked={visible}
        onCheckedChange={handleToggle}
        disabled={loading}
        aria-label="Toggle contact page visibility on main site"
      />
    </label>
  );
}
