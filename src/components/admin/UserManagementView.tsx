import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Shield,
  User as UserIcon,
  UserX,
} from "lucide-react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { logger as log } from "../../utils/logger";
interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  active?: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export function UserManagementView({
  onBack,
  currentUserId,
}: {
  onBack: () => void;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await api.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      log.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "admin"
  ) => {
    try {
      await api.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      log.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleInactivateUser = async (userId: string) => {
    try {
      await api.updateUser(userId, { active: false });
      toast.success("User inactivated successfully");
      loadUsers();
    } catch (error) {
      log.error("Error inactivating user:", error);
      toast.error("Failed to inactivate user");
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await api.updateUser(userId, { active: true });
      toast.success("User reactivated successfully");
      loadUsers();
    } catch (error) {
      log.error("Error reactivating user:", error);
      toast.error("Failed to reactivate user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      log.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword("");
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const updates: any = {};
      if (editName !== editingUser.name) updates.name = editName;
      if (editEmail !== editingUser.email) updates.email = editEmail;
      if (editPassword) updates.password = editPassword;

      if (Object.keys(updates).length > 0) {
        await api.updateUser(editingUser.id, updates);
        toast.success("User updated successfully");
        loadUsers();
      }

      setEditingUser(null);
      setEditName("");
      setEditEmail("");
      setEditPassword("");
    } catch (error) {
      log.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-md border border-[#211f1c] dark:border-white/20 bg-waste-compost hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="normal uppercase">User Management</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-[14px] text-black/70 dark:text-white/70">
            Loading users...
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="normal">Email</TableHead>
                <TableHead className="normal">Name</TableHead>
                <TableHead className="normal">Role</TableHead>
                <TableHead className="normal">Created</TableHead>
                <TableHead className="normal">Last Sign In</TableHead>
                <TableHead className="normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-[12px] normal">
                    {user.email}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-[10px] text-black/50 dark:text-white/50">
                        (You)
                      </span>
                    )}
                    {user.active === false && (
                      <span className="ml-2 px-2 py-0.5 text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] normal">
                    {user.name}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: "user" | "admin") =>
                        handleRoleChange(user.id, value)
                      }
                      disabled={user.id === currentUserId}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <UserIcon size={12} />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield size={12} />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-[11px] text-black/70 dark:text-white/70">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-[11px] text-black/70 dark:text-white/70">
                    {formatDate(user.last_sign_in_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-waste-reuse hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                        title="Edit user"
                      >
                        <Edit2 size={12} className="text-black" />
                      </button>
                      {user.id !== currentUserId && (
                        <>
                          {user.active !== false ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#f4d3a0] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                                  title="Inactivate user"
                                >
                                  <UserX size={12} className="text-black" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="normal">
                                    Inactivate User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-black/70 dark:text-white/70">
                                    Inactivate {user.email}? They won't be able
                                    to log in, but their data will be preserved.
                                    You can reactivate them later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleInactivateUser(user.id)
                                    }
                                    className="bg-[#f4d3a0] text-black hover:bg-[#e5c591]"
                                  >
                                    Inactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                              title="Reactivate user"
                            >
                              <UserIcon size={12} className="text-black" />
                            </button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-waste-compost hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                                title="Delete user"
                              >
                                <Trash2 size={12} className="text-black" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="normal">
                                  Delete User
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-black/70 dark:text-white/70">
                                  Are you sure you want to delete {user.email}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-waste-compost text-black hover:bg-waste-compost/80"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <AlertDialog
          open={!!editingUser}
          onOpenChange={() => setEditingUser(null)}
        >
          <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="normal">Edit User</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name" className="text-[12px] normal">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-[12px] normal">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-password" className="text-[12px] normal">
                  New Password (leave blank to keep current)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveEdit}
                className="bg-waste-reuse text-black hover:bg-[#a8b8bb]"
              >
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
