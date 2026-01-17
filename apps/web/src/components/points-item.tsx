"use client";

/**
 * PointsItem Component
 *
 * Displays a point transaction with color-coded amount.
 */

interface PointsItemProps {
  amount: number;
  reason: string;
  createdAt: string;
}

export function PointsItem({ amount, reason, createdAt }: PointsItemProps) {
  const isPositive = amount > 0;
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex-1">
        <div className="font-medium">{reason}</div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </div>
      <span
        className={`font-bold text-lg ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {amount}
      </span>
    </div>
  );
}
