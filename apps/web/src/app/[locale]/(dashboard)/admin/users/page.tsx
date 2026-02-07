"use client";

/**
 * Admin Users Management Page
 *
 * Lists all users and allows role changes, editing, and deletion.
 */

import { Pencil, Trash2, UserCog, Users, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CreateUserDialog } from "@/components/create-user-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers, useUpdateUserRole, useDeleteUser, type User } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  "ADMIN",
  "SUPERVISOR",
  "TEACHER",
  "EXAMINER",
  "STUDENT",
] as const;

function getRoleBadgeVariant(
  role: string
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

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

      // Delete User Logic
    const deleteUserMutation = useDeleteUser();
    const handleConfirmDelete = async () => {
      if (!selectedUser) return;
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      toast({
        title: t("userDeleted"),
        description: t("deleteSuccess"),
      });
    };
  
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              {t("usersManagement")}
            </h1>
            <p className="text-muted-foreground">{t("usersDesc")}</p>
          </div>
          <CreateUserDialog />
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
                      <TableHead className="w-[280px]">{t("actions")}</TableHead>
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
                          <div className="flex items-center gap-2">
                            {/* Role Select */}
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                handleRoleChange(user.id, value)
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-[130px]">
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
  
                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(user)}
                              title={t("editUser")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
  
                            {/* Reset Password Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setResetPasswordDialogOpen(true);
                              }}
                              title={t("resetPassword") || "Reset Password"}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(user)}
                              title={t("deleteUser")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
  
        {/* Edit User Dialog */}
        <EditUserDialog
          open={editDialogOpen}
          user={selectedUser}
          onOpenChange={setEditDialogOpen}
        />

        {/* Reset Password Dialog */}
        <ResetPasswordDialog
          open={resetPasswordDialogOpen}
          user={selectedUser}
          onOpenChange={setResetPasswordDialogOpen}
        />
  
        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t("deleteUser")}
          description={t("deleteConfirmation", { name: selectedUser?.fullName || "" })}
          variant="destructive"
          icon={<Trash2 className="h-5 w-5" />}
          isPending={deleteUserMutation.isPending}
          onConfirm={handleConfirmDelete}
          confirmLabel={t("deleteUser")}
        />
      </div>
    );
  }

