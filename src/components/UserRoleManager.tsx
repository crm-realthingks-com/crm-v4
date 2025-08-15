
import React, { useState } from 'react';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface UserRoleManagerProps {
  users: AppUser[];
}

const UserRoleManager = ({ users }: UserRoleManagerProps) => {
  const { userRoles, isAdmin, assignRole, removeRole, loading } = useUserRoles();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don't have permission to manage user roles.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) return;
    
    const success = await assignRole(selectedUserId, selectedRole);
    if (success) {
      setSelectedUserId('');
      setSelectedRole('user');
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    await removeRole(userId, role);
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(ur => ur.user_id === userId);
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-yellow-100 text-yellow-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign Role Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.user_metadata?.full_name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Role</label>
              <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAssignRole}
              disabled={!selectedUserId || !selectedRole}
            >
              Assign Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => {
              const roles = getUserRoles(user.id);
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {user.user_metadata?.full_name || user.email || user.id}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {roles.length === 0 ? (
                      <Badge variant="outline">No roles assigned</Badge>
                    ) : (
                      roles.map(userRole => (
                        <div key={userRole.id} className="flex items-center gap-1">
                          <Badge className={getRoleColor(userRole.role)}>
                            {userRole.role}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveRole(user.id, userRole.role)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManager;
