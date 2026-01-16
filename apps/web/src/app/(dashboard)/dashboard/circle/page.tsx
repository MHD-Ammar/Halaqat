/**
 * My Circle Page
 * 
 * Manage study circles (Halaqat).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

export default function CirclePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Circles</h1>
          <p className="text-muted-foreground">Manage your study circles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Circle
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No circles yet</CardTitle>
          <CardDescription className="text-center mb-4">
            Create your first study circle to get started
          </CardDescription>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Circle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
