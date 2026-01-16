/**
 * Students Page
 * 
 * View and manage students.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function StudentsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage your students</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No students yet</CardTitle>
          <CardDescription className="text-center mb-4">
            Add students to your circles to track their progress
          </CardDescription>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
