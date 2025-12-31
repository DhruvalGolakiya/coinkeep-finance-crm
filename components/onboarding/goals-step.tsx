"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  FirstAidKit,
  Airplane,
  Car,
  House,
  GraduationCap,
  Laptop,
  PiggyBank,
  TrendUp,
  Check,
  Trash,
  Target,
} from "@phosphor-icons/react";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";

interface GoalEntry {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  enabled: boolean;
  icon: string;
  color: string;
}

const GOAL_SUGGESTIONS: Record<UseCase, GoalEntry[]> = {
  personal: [
    { id: "emergency", name: "Emergency Fund", targetAmount: "10000", currentAmount: "", enabled: true, icon: "FirstAidKit", color: "#22c55e" },
    { id: "vacation", name: "Vacation Fund", targetAmount: "3000", currentAmount: "", enabled: false, icon: "Airplane", color: "#3b82f6" },
    { id: "car", name: "New Car", targetAmount: "25000", currentAmount: "", enabled: false, icon: "Car", color: "#8b5cf6" },
    { id: "house", name: "House Down Payment", targetAmount: "50000", currentAmount: "", enabled: false, icon: "House", color: "#6366f1" },
  ],
  freelancer: [
    { id: "emergency", name: "Emergency Fund", targetAmount: "15000", currentAmount: "", enabled: true, icon: "FirstAidKit", color: "#22c55e" },
    { id: "tax", name: "Tax Reserve", targetAmount: "5000", currentAmount: "", enabled: true, icon: "PiggyBank", color: "#f59e0b" },
    { id: "equipment", name: "Equipment Upgrade", targetAmount: "3000", currentAmount: "", enabled: false, icon: "Laptop", color: "#8b5cf6" },
    { id: "education", name: "Course / Training", targetAmount: "1000", currentAmount: "", enabled: false, icon: "GraduationCap", color: "#ec4899" },
  ],
  small_business: [
    { id: "reserve", name: "Business Reserve", targetAmount: "25000", currentAmount: "", enabled: true, icon: "PiggyBank", color: "#22c55e" },
    { id: "growth", name: "Growth Fund", targetAmount: "50000", currentAmount: "", enabled: false, icon: "TrendUp", color: "#3b82f6" },
    { id: "equipment", name: "Equipment", targetAmount: "10000", currentAmount: "", enabled: false, icon: "Laptop", color: "#8b5cf6" },
  ],
  agency: [
    { id: "reserve", name: "Operating Reserve", targetAmount: "50000", currentAmount: "", enabled: true, icon: "PiggyBank", color: "#22c55e" },
    { id: "expansion", name: "Expansion Fund", targetAmount: "100000", currentAmount: "", enabled: false, icon: "TrendUp", color: "#3b82f6" },
    { id: "hiring", name: "Hiring Budget", targetAmount: "30000", currentAmount: "", enabled: false, icon: "Target", color: "#8b5cf6" },
  ],
};

interface GoalsStepProps {
  useCase: UseCase;
  currencySymbol: string;
  onNext: (goals: GoalEntry[]) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function GoalsStep({
  useCase,
  currencySymbol,
  onNext,
  onBack,
  onSkip,
  isLoading,
}: GoalsStepProps) {
  const [goals, setGoals] = useState<GoalEntry[]>(
    GOAL_SUGGESTIONS[useCase] || GOAL_SUGGESTIONS.personal
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const toggleEnabled = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const updateGoal = (id: string, field: "targetAmount" | "currentAmount", value: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addGoal = () => {
    if (!newName.trim() || !newTarget.trim()) return;
    
    const newGoal: GoalEntry = {
      id: Date.now().toString(),
      name: newName.trim(),
      targetAmount: newTarget,
      currentAmount: "",
      enabled: true,
      icon: "Target",
      color: "#6366f1",
    };
    
    setGoals((prev) => [...prev, newGoal]);
    setNewName("");
    setNewTarget("");
    setShowAddForm(false);
  };

  const handleNext = () => {
    // Filter to only enabled goals with target amounts
    const validGoals = goals.filter(
      (g) => g.enabled && parseFloat(g.targetAmount) > 0
    );
    onNext(validGoals);
  };

  const hasValidGoals = goals.some(
    (g) => g.enabled && parseFloat(g.targetAmount) > 0
  );

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, typeof Target> = {
      FirstAidKit,
      Airplane,
      Car,
      House,
      GraduationCap,
      Laptop,
      PiggyBank,
      TrendUp,
      Target,
    };
    return icons[iconName] || Target;
  };

  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set Your Financial Goals</CardTitle>
        <CardDescription>
          What are you saving for? We&apos;ll help you track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goals List */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {goals.map((goal) => {
            const Icon = getIconComponent(goal.icon);
            return (
              <div
                key={goal.id}
                className={`p-3 border rounded-sm transition-colors ${
                  goal.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox
                    checked={goal.enabled}
                    onCheckedChange={() => toggleEnabled(goal.id)}
                    disabled={isLoading}
                  />
                  <div
                    className="size-8 rounded-sm flex items-center justify-center shrink-0"
                    style={{ backgroundColor: goal.color + "20" }}
                  >
                    <Icon
                      className="size-4"
                      style={{ color: goal.color }}
                      weight="duotone"
                    />
                  </div>
                  <span className="text-sm font-medium flex-1">{goal.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                    disabled={isLoading}
                    className="size-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="size-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pl-10">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Target
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        placeholder="10,000"
                        value={goal.targetAmount}
                        onChange={(e) => updateGoal(goal.id, "targetAmount", e.target.value)}
                        className="pl-6 h-8 text-sm"
                        disabled={isLoading || !goal.enabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Already Saved
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={goal.currentAmount}
                        onChange={(e) => updateGoal(goal.id, "currentAmount", e.target.value)}
                        className="pl-6 h-8 text-sm"
                        disabled={isLoading || !goal.enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Form */}
        {showAddForm ? (
          <div className="flex items-center gap-2 p-3 border rounded-sm border-dashed">
            <Input
              type="text"
              placeholder="Goal name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-8"
              autoFocus
            />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                {currencySymbol}
              </span>
              <Input
                type="number"
                placeholder="Target"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="pl-6 h-8"
              />
            </div>
            <Button size="sm" onClick={addGoal} className="h-8">
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full border-dashed"
            disabled={isLoading}
          >
            <Plus className="size-4 mr-2" />
            Add Custom Goal
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={onSkip}
            className="h-10"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-10 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>{hasValidGoals ? "Continue" : "Skip"}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
