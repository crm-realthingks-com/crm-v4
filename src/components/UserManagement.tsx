
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import UserModal from "./UserModal";
import EditUserModal from "./EditUserModal";
import ChangeRoleModal from "./ChangeRoleModal";
import DeleteUserDialog from "./DeleteUserDialog";

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    role?: string;
  };
  created_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No valid session found. Please log in again.");
      }
      
      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching users:', error);
        if (error.message?.includes('Invalid token') || error.message?.includes('Session not found')) {
          throw new Error("Your session has expired. Please refresh the page and log in again.");
        }
        throw error;
      }
      
      console.log('Users fetched successfully:', data.users?.length || 0);
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const syncWithAuth = useCallback(async () => {
    try {
      toast({
        title: "Syncing",
        description: "Refreshing session and syncing with Supabase Auth...",
      });
      
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error("Failed to refresh session. Please log in again.");
      }
      
      await fetchUsers();
      toast({
        title: "Success",
        description: "Successfully synced with Supabase Auth",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to sync with auth",
        variant: "destructive",
      });
    }
  }, [fetchUsers, toast]);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  }, []);

  const handleChangeRole = useCallback((user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  }, []);

  const handleToggleUserStatus = useCallback(async (user: User) => {
    try {
      const action = user.banned_until ? 'activate' : 'deactivate';
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'PUT',
        body: {
          userId: user.id,
          action: action
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  }, [fetchUsers, toast]);

  const handleDeleteUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  }, []);

  const getRoleBadgeVariant = useCallback((role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={syncWithAuth}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Sync with Auth
              </Button>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.user_metadata?.full_name || user.email.split('@')[0]}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.user_metadata?.role || 'user')}>
                      {user.user_metadata?.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'M/d/yyyy')}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at 
                      ? format(new Date(user.last_sign_in_at), 'M/d/yyyy')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          Edit Display Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                          {user.banned_until ? 'Activate' : 'Deactivate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />
      
      <EditUserModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
      
      <ChangeRoleModal 
        open={showRoleModal} 
        onClose={() => setShowRoleModal(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
      
      <DeleteUserDialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </>
  );
};

export default UserManagement;
