"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOverrideSubmission } from "@/hooks/use-admin-challenges";
import { useToast } from "@/hooks/use-toast";

interface OverrideFormProps {
  submissionId: string;
  initialXp: number;
  initialData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OverrideForm({
  submissionId,
  initialXp,
  initialData,
  onSuccess,
  onCancel,
}: OverrideFormProps) {
  const [xpEarned, setXpEarned] = useState(initialXp.toString());
  const [jsonStr, setJsonStr] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);

  const overrideMutation = useOverrideSubmission();
  const { toast } = useToast();

  const handleSave = async () => {
    setError(null);
    let submissionData;
    const xpNum = Number(xpEarned);

    if (isNaN(xpNum)) {
      setError("XP must be a valid number");
      return;
    }

    try {
      submissionData = JSON.parse(jsonStr);
    } catch {
      setError("Invalid JSON format in submission data");
      return;
    }

    try {
      await overrideMutation.mutateAsync({
        id: submissionId,
        data: { xpEarned: xpNum, submissionData },
      });
      toast({
        title: "Success",
        description: "Submission overridden successfully",
      });
      onSuccess();
    } catch {
      toast({
        title: "Error",
        description: "Failed to override submission",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t mt-4">
      <h3 className="font-semibold text-lg text-destructive">Danger Zone: Override</h3>
      
      <div className="space-y-2">
        <Label>XP Earned</Label>
        <Input 
          type="number" 
          value={xpEarned} 
          onChange={(e) => setXpEarned(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label>Raw JSON Data</Label>
        <Textarea 
          className="font-mono text-xs min-h-[150px]"
          value={jsonStr}
          onChange={(e) => setJsonStr(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={overrideMutation.isPending}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleSave} 
          disabled={overrideMutation.isPending}
          className="min-w-24"
        >
          {overrideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Override"}
        </Button>
      </div>
    </div>
  );
}
