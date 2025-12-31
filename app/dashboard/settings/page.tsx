"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, UserIcon, GlobeIcon, SunIcon, MoonIcon, DesktopIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "CHF", label: "CHF - Swiss Franc" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (DE)" },
];

const FISCAL_MONTHS = [
  { value: "january", label: "January" },
  { value: "february", label: "February" },
  { value: "march", label: "March" },
  { value: "april", label: "April" },
  { value: "may", label: "May" },
  { value: "june", label: "June" },
  { value: "july", label: "July" },
  { value: "august", label: "August" },
  { value: "september", label: "September" },
  { value: "october", label: "October" },
  { value: "november", label: "November" },
  { value: "december", label: "December" },
];

const categoryColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#6b7280",
];

const categoryIcons = [
  "Wallet", "Briefcase", "TrendUp", "House", "Plus",
  "ForkKnife", "Car", "ShoppingCart", "GameController", "Lightning",
  "FirstAid", "GraduationCap", "Airplane", "Repeat", "Shield",
  "Receipt", "DotsThree",
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);
  const seedDefaults = useMutation(api.categories.seedDefaults);
  const updateProfile = useMutation(api.users.updateProfile);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileBusinessName, setProfileBusinessName] = useState("");
  const [profileCurrency, setProfileCurrency] = useState("USD");
  const [profileDateFormat, setProfileDateFormat] = useState("MM/DD/YYYY");
  const [profileFiscalYear, setProfileFiscalYear] = useState("january");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Initialize profile state from user data
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileBusinessName(user.businessName || "");
      setProfileCurrency(user.currency || "USD");
      setProfileDateFormat(user.dateFormat || "MM/DD/YYYY");
      setProfileFiscalYear(user.fiscalYearStart || "january");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    
    setIsSavingProfile(true);
    try {
      await updateProfile({
        email: user.email,
        name: profileName,
        businessName: profileBusinessName || undefined,
        currency: profileCurrency,
        dateFormat: profileDateFormat,
        fiscalYearStart: profileFiscalYear,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    _id: Id<"categories">;
    name: string;
    type: "income" | "expense";
    icon: string;
    color: string;
    isDefault: boolean;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"categories"> | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState(categoryIcons[0]);
  const [color, setColor] = useState(categoryColors[0]);

  const incomeCategories = categories?.filter((c) => c.type === "income") ?? [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  const handleOpenForm = (category?: typeof editingCategory) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setType(category.type);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName("");
      setType("expense");
      setIcon(categoryIcons[0]);
      setColor(categoryColors[0]);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateCategory({
        id: editingCategory._id,
        name,
        icon,
        color,
      });
    } else {
      await createCategory({ name, type, icon, color });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteCategory({ id: deletingId });
      } catch (error) {
        console.error("Failed to delete:", error);
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Header title="Settings" subtitle="Manage your categories and preferences" />

      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your personal and business information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-business">Business Name</FieldLabel>
                <Input
                  id="profile-business"
                  value={profileBusinessName}
                  onChange={(e) => setProfileBusinessName(e.target.value)}
                  placeholder="Your business name (optional)"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-currency">Currency</FieldLabel>
                <Select value={profileCurrency} onValueChange={(v) => setProfileCurrency(v ?? "USD")}>
                  <SelectTrigger id="profile-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-date-format">Date Format</FieldLabel>
                <Select value={profileDateFormat} onValueChange={(v) => setProfileDateFormat(v ?? "MM/DD/YYYY")}>
                  <SelectTrigger id="profile-date-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DATE_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-fiscal">Fiscal Year Starts</FieldLabel>
                <Select value={profileFiscalYear} onValueChange={(v) => setProfileFiscalYear(v ?? "january")}>
                  <SelectTrigger id="profile-fiscal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FISCAL_MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

  
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Organize your transactions with custom categories
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(!categories || categories.length === 0) && (
                  <Button variant="outline" size="sm" onClick={() => seedDefaults()}>
                    Load Defaults
                  </Button>
                )}
                <Button size="sm" onClick={() => handleOpenForm()}>
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Income Categories */}
            <div>
              <h3 className="mb-3 text-sm font-medium flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                Income Categories
              </h3>
              {incomeCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No income categories</p>
              ) : (
                <div className="rounded-lg border divide-y">
                  {incomeCategories.map((category) => (
                    <div
                      key={category._id}
                      className="group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-4 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Default
                          </Badge>
                        )}
                      </div>
                      {!category.isDefault && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenForm(category as typeof editingCategory)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(category._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div>
              <h3 className="mb-3 text-sm font-medium flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                Expense Categories
              </h3>
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No expense categories</p>
              ) : (
                <div className="rounded-lg border divide-y">
                  {expenseCategories.map((category) => (
                    <div
                      key={category._id}
                      className="group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-4 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Default
                          </Badge>
                        )}
                      </div>
                      {!category.isDefault && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenForm(category as typeof editingCategory)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(category._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Export Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GlobeIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Export your financial data for backup or migration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download all your financial data including transactions, accounts, invoices, and clients in JSON format.
                This can be used for backup purposes or to migrate your data to another system.
              </p>
              <Button 
                variant="outline"
                onClick={async () => {
                  // Fetch all data from Convex
                  const exportData = {
                    exportedAt: new Date().toISOString(),
                    user: {
                      name: user?.name,
                      email: user?.email,
                      currency: user?.currency,
                      businessName: user?.businessName,
                    },
                    categories: categories ?? [],
                  };
                  
                  // Create and download JSON file
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `financeflow-export-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Data exported successfully");
                }}
              >
                Export Data (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Form Dialog */}
      <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="category-name">Name</FieldLabel>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                  required
                />
              </Field>

              {!editingCategory && (
                <Field>
                  <FieldLabel htmlFor="category-type">Type</FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as "income" | "expense")}
                    items={[
                      { value: "income", label: "Income" },
                      { value: "expense", label: "Expense" },
                    ]}
                  >
                    <SelectTrigger id="category-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <FieldLabel>Color</FieldLabel>
                <div className="flex gap-2 flex-wrap">
                  {categoryColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`size-7 rounded-full transition-all ${
                        color === c
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </Field>
            </FieldGroup>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button type="submit">
                {editingCategory ? "Save" : "Create"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Transactions using
              this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

