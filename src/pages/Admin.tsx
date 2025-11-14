import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, addUser, updateUser, deleteUser, initializeDemoUsers } from "@/lib/auth";
import { User } from "@/types";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Plus, Pencil, Trash2, Shield, Calendar, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MASTER_PASSWORD = "admin2024";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formValidity, setFormValidity] = useState<"lifetime" | number>("lifetime");

  useEffect(() => {
    if (authenticated) {
      loadUsers();
    }
  }, [authenticated]);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleMasterLogin = () => {
    if (password === MASTER_PASSWORD) {
      setAuthenticated(true);
    } else {
      toast({
        title: "Invalid password",
        description: "Please enter the correct master password",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = () => {
    try {
      addUser(formUsername, formPassword, formValidity);
      toast({
        title: "User added",
        description: `${formUsername} has been added successfully`,
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    try {
      updateUser(editingUser.id, {
        username: formUsername,
        password: formPassword,
        validity: formValidity,
      });
      toast({
        title: "User updated",
        description: `${formUsername} has been updated successfully`,
      });
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete ${username}?`)) {
      deleteUser(userId);
      toast({
        title: "User deleted",
        description: `${username} has been removed`,
      });
      loadUsers();
    }
  };

  const resetForm = () => {
    setFormUsername("");
    setFormPassword("");
    setFormValidity("lifetime");
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormPassword(user.password);
    setFormValidity(user.validity);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <ParticlesBackground />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block glass-panel glow-cyan rounded-2xl px-6 py-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-neon bg-clip-text text-transparent">
                  Admin Panel
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Master Access</h1>
            <p className="text-muted-foreground">Enter master password to continue</p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMasterLogin();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="master-password">Master Password</Label>
                <Input
                  id="master-password"
                  type="password"
                  placeholder="Enter master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-panel border-border"
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-neon hover:opacity-90 font-semibold">
                <Lock className="w-4 h-4 mr-2" />
                Authenticate
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="glass-panel glow-cyan rounded-xl px-4 py-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-bold bg-gradient-neon bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and subscriptions</p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-neon hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with credentials</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-username">Username</Label>
                    <Input
                      id="add-username"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Enter username"
                      className="glass-panel border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-password">Password</Label>
                    <Input
                      id="add-password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter password"
                      className="glass-panel border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-validity">Validity Period</Label>
                    <Select
                      value={formValidity.toString()}
                      onValueChange={(value) =>
                        setFormValidity(value === "lifetime" ? "lifetime" : parseInt(value))
                      }
                    >
                      <SelectTrigger className="glass-panel border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-border">
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} className="w-full bg-gradient-neon hover:opacity-90">
                    Add User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-secondary/20">
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Device Hash</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-secondary/20">
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="font-mono text-sm">{user.password}</TableCell>
                    <TableCell>
                      {user.validity === "lifetime" ? (
                        <span className="text-success">Lifetime</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {user.validity} days
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {user.deviceHash ? user.deviceHash.substring(0, 8) + "..." : "Not set"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="glass-panel border-border"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="glass-panel border-border text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Edit Dialog */}
          <Dialog
            open={editingUser !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingUser(null);
                resetForm();
              }
            }}
          >
            <DialogContent className="glass-panel border-border">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user credentials and validity</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Enter username"
                    className="glass-panel border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Password</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password"
                    className="glass-panel border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-validity">Validity Period</Label>
                  <Select
                    value={formValidity.toString()}
                    onValueChange={(value) =>
                      setFormValidity(value === "lifetime" ? "lifetime" : parseInt(value))
                    }
                  >
                    <SelectTrigger className="glass-panel border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-border">
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateUser} className="w-full bg-gradient-neon hover:opacity-90">
                  Update User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Admin;
