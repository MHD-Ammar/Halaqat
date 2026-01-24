"use client";

/**
 * Admin Users Management Page
 *
 * Lists all users and allows role changes.
 */

import { useTranslations } from "next-intl";
import { UserCog, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers, useUpdateUserRole, type User } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  "ADMIN",
  "SUPERVISOR",
  "TEACHER",
  "EXAMINER",
  "STUDENT",
] as const;

function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "SUPERVISOR":
      return "default";
    case "TEACHER":
      return "secondary";
    case "EXAMINER":
      return "outline";
    default:
      return "secondary";
  }
}

export default function AdminUsersPage() {
  const t = useTranslations("Admin");
  const tRoles = useTranslations("Roles");
  const { data: users = [], isLoading } = useUsers();
  const updateRoleMutation = useUpdateUserRole();
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast({
        title: t("roleUpdated"),
        variant: "default",
      });
    } catch {
      toast({
        title: "Error updating role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCog className="h-6 w-6" />
          {t("usersManagement")}
        </h1>
        <p className="text-muted-foreground">{t("usersDesc")}</p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("usersManagement")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("noUsers")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead className="w-[200px]">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.fullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {tRoles(user.role as any)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder={t("selectRole")} />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {tRoles(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
