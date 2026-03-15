"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

interface LanguageRow {
  code: string;
  name: string;
  nativeName: string;
  fontStack: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

interface LanguagesClientProps {
  initialLanguages: LanguageRow[];
}

export function LanguagesClient({ initialLanguages }: LanguagesClientProps) {
  const router = useRouter();
  const [languages, setLanguages] = useState(initialLanguages);
  const [showAdd, setShowAdd] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formNative, setFormNative] = useState("");
  const [formFont, setFormFont] = useState("");
  const [formSort, setFormSort] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormNative("");
    setFormFont("");
    setFormSort(0);
    setFormErrors({});
  };

  const startEdit = (lang: LanguageRow) => {
    setEditCode(lang.code);
    setFormName(lang.name);
    setFormNative(lang.nativeName);
    setFormFont(lang.fontStack ?? "");
    setFormSort(lang.sortOrder ?? 0);
    setFormErrors({});
  };

  const handleAdd = async () => {
    const errors: Record<string, string> = {};
    if (!formCode.trim()) errors.code = "Code is required";
    if (!/^[a-z]{2,10}$/.test(formCode)) errors.code = "Must be 2-10 lowercase letters";
    if (!formName.trim()) errors.name = "Name is required";
    if (!formNative.trim()) errors.native = "Native name is required";
    if (languages.some((l) => l.code === formCode)) errors.code = "Code already exists";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormSaving(true);
    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          nativeName: formNative,
          fontStack: formFont || undefined,
          sortOrder: formSort,
        }),
      });
      if (res.ok) {
        const lang = await res.json();
        setLanguages((prev) => [...prev, lang]);
        setShowAdd(false);
        resetForm();
        toast.success("Language added");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add");
      }
    } catch {
      toast.error("Failed to add language");
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCode) return;
    setFormSaving(true);
    try {
      const res = await fetch("/api/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editCode,
          name: formName,
          nativeName: formNative,
          fontStack: formFont || null,
          sortOrder: formSort,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLanguages((prev) =>
          prev.map((l) => (l.code === editCode ? { ...l, ...updated } : l))
        );
        setEditCode(null);
        resetForm();
        toast.success("Language updated");
        router.refresh();
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update language");
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleActive = async (code: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, isActive }),
      });
      if (res.ok) {
        setLanguages((prev) =>
          prev.map((l) => (l.code === code ? { ...l, isActive } : l))
        );
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteCode) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/languages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteCode }),
      });
      if (res.ok) {
        setLanguages((prev) => prev.filter((l) => l.code !== deleteCode));
        setDeleteCode(null);
        toast.success("Language deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete language");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Languages</h1>
        <Button onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Language
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-6 space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">Add New Language</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Code</Label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. ko" className="mt-1" />
              {formErrors.code && <p className="mt-1 text-sm text-destructive">{formErrors.code}</p>}
            </div>
            <div>
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Korean" className="mt-1" />
              {formErrors.name && <p className="mt-1 text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div>
              <Label>Native Name</Label>
              <Input value={formNative} onChange={(e) => setFormNative(e.target.value)} placeholder="e.g. 한국어" className="mt-1" />
              {formErrors.native && <p className="mt-1 text-sm text-destructive">{formErrors.native}</p>}
            </div>
            <div>
              <Label>Font Stack</Label>
              <Input value={formFont} onChange={(e) => setFormFont(e.target.value)} placeholder="Optional" className="mt-1" />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={formSort} onChange={(e) => setFormSort(parseInt(e.target.value, 10) || 0)} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={formSaving} size="sm" className="gap-1">
              <Save className="h-3 w-3" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)} className="gap-1">
              <X className="h-3 w-3" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Native Name</th>
              <th className="px-4 py-3 text-center font-medium">Sort</th>
              <th className="px-4 py-3 text-center font-medium">Active</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang) =>
              editCode === lang.code ? (
                <tr key={lang.code} className="border-b bg-muted/20">
                  <td className="px-4 py-3 font-mono">{lang.code}</td>
                  <td className="px-4 py-3">
                    <Input size={1} value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8" />
                  </td>
                  <td className="px-4 py-3">
                    <Input size={1} value={formNative} onChange={(e) => setFormNative(e.target.value)} className="h-8" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input type="number" value={formSort} onChange={(e) => setFormSort(parseInt(e.target.value, 10) || 0)} className="h-8 w-16 mx-auto text-center" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={lang.isActive ?? true} disabled />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" onClick={handleUpdate} disabled={formSaving}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditCode(null)}>Cancel</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={lang.code} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{lang.code}</td>
                  <td className="px-4 py-3">{lang.name}</td>
                  <td className="px-4 py-3">{lang.nativeName}</td>
                  <td className="px-4 py-3 text-center">{lang.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={lang.isActive ?? true}
                      onCheckedChange={(checked) => handleToggleActive(lang.code, checked)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(lang)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCode(lang.code)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteCode !== null} onOpenChange={() => setDeleteCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the &ldquo;{deleteCode}&rdquo; language?
            This may affect existing song translations in this language.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCode(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
