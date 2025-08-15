
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MoreHorizontal, Plus, RefreshCw, Shield, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import UserModal from "./UserModal";
import EditUserModal from "./EditUserModal";
import ChangeRoleModal from "./ChangeRoleModal";
import DeleteUserDialog from "./DeleteUserDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
  created_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
  role?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users with server-controlled roles...');
      
      const { data, error } = await supabase.functions.invoke('user-admin', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      // Fetch roles for all users
      const userIds = data.users?.map((user: any) => user.id) || [];
      
      let userRoles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesData) {
          userRoles = rolesData.reduce((acc: Record<string, string>, item: any) => {
            acc[item.user_id] = item.role;
            return acc;
          }, {});
        }
      }
      
      // Combine user data with roles
      const usersWithRoles = data.users?.map((user: any) => ({
        ...user,
        role: userRoles[user.id] || 'user'
      })) || [];
      
      console.log('Users fetched successfully:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    }
  }, [toast]);

  const syncAndRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Refresh session first
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error("Failed to refresh session");
      }
      
      // Fetch latest users
      await fetchUsers();
      
      // Refresh current user data
      await refreshUser();
      
      toast({
        title: "Success",
        description: "User data synced successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sync Error", 
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchUsers, refreshUser, toast]);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  }, []);

  const handleChangeRole = useCallback((user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  }, []);

  const handleResetPassword = useCallback((user: User) => {
    setSelectedUser(user);
    setShowResetPasswordDialog(true);
  }, []);

  const handleToggleUserStatus = useCallback(async (user: User) => {
    try {
      const action = user.banned_until ? 'activate' : 'deactivate';
      
      toast({
        title: "Processing",
        description: `${action === 'activate' ? 'Activating' : 'Deactivating'} user...`,
      });

      const { data, error } = await supabase.functions.invoke('user-admin', {
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
      await refreshUser();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  }, [fetchUsers, refreshUser, toast]);

  const handleDeleteUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  }, []);

  const handleUserSuccess = useCallback(async () => {
    await fetchUsers();
    await refreshUser();
  }, [fetchUsers, refreshUser]);

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

  const getRoleIcon = useCallback((role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'manager':
        return <ShieldAlert className="h-3 w-3" />;
      default:
        return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    
    loadData();
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts, roles, and permissions with server-controlled security
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncAndRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync & Refresh'}
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
                <TableHead>Status</TableHead>
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
                    <Badge variant={getRoleBadgeVariant(user.role || 'user')} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role || 'user')}
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.banned_until ? 'destructive' : 'default'}>
                      {user.banned_until ? 'Deactivated' : 'Active'}
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
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          Reset Password
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
        onSuccess={handleUserSuccess}
      />
      
      <EditUserModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
      
      <ChangeRoleModal 
        open={showRoleModal} 
        onClose={() => setShowRoleModal(false)}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
      
      <DeleteUserDialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
      
      <ResetPasswordDialog 
        open={showResetPasswordDialog} 
        onClose={() => setShowResetPasswordDialog(false)}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
    </>
  );
};

export default UserManagement;
