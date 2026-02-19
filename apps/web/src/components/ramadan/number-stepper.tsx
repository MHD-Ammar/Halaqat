import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
  multiplier?: number;
}

export function NumberStepper({
  value = 0,
  onChange,
  max = 100,
  min = 0,
  step = 1,
}: NumberStepperProps) {
  const increment = () => {
    if (value + step <= max) onChange(value + step);
  };

  const decrement = () => {
    if (value - step >= min) onChange(value - step);
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-14 w-14 rounded-full border-2"
        onClick={decrement}
        disabled={value <= min}
      >
        <Minus className="w-6 h-6" />
      </Button>

      <div className="w-24 text-center">
        <span className="text-4xl font-bold font-mono tracking-tighter">
          {value}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-14 w-14 rounded-full border-2"
        onClick={increment}
        disabled={value >= max}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
