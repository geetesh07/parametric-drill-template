import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, Trash2, UserPlus, UserMinus, Users } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithMetadata {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name?: string;
    username?: string;
    phone_number?: string;
    role?: string;
    is_approved?: boolean;
  };
  is_approved?: boolean;
}

interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  username?: string;
  phone_number?: string;
  role?: string;
  is_approved?: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { updateUserRole, approveUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get the current user to check if they're an admin
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      // Check if current user is an admin
      if (currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Use supabaseAdmin to fetch users with minimal data
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, username, phone_number, role, is_approved, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        // Check for specific error related to service role key
        if (error.message?.includes('JWT') || error.message?.includes('token') || error.code === 'PGRST301') {
          console.error('Service role key error:', error);
          toast.error('Admin access error: Please check your service role key configuration');
          return;
        }
        throw error;
      }
      
      if (!data || data.length === 0) {
        setUsers([]);
        return;
      }
      
      // Convert the data to UserWithMetadata format with minimal information
      const formattedUsers = (data as DatabaseUser[]).map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        is_approved: user.is_approved,
        user_metadata: {
          full_name: user.full_name || '',
          username: user.username || '',
          phone_number: user.phone_number || '',
          role: user.role || 'user',
          is_approved: user.is_approved
        }
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Also update the user's metadata in auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: newRole
          }
        }
      );

      if (authError) throw authError;
      
      toast.success('User role updated successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      await approveUser(userId);
      toast.success('User approved successfully');
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(`Failed to approve user: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // First delete from the users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      // Then delete the user from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast.success("Success", {
        description: "User deleted successfully.",
      });
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Error", {
        description: "Failed to delete user. Please try again.",
      });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      toast.success("Success", {
        description: "User approved successfully.",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error("Error", {
        description: "Failed to approve user. Please try again.",
      });
    }
  };

  const handleUnapprove = async (userId: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_approved: false })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Success", {
        description: "User unapproved successfully.",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error unapproving user:', error);
      toast.error("Error", {
        description: "Failed to unapprove user. Please try again.",
      });
    }
  };

  const handleBulkApprove = async () => {
    try {
      for (const userId of selectedUsers) {
        await approveUser(userId);
      }
      toast.success("Success", {
        description: "Selected users approved successfully.",
      });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk approving users:', error);
      toast.error("Error", {
        description: "Failed to approve some users. Please try again.",
      });
    }
  };

  const handleBulkUnapprove = async () => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_approved: false })
        .in('id', selectedUsers);

      if (error) throw error;

      toast.success("Success", {
        description: "Selected users unapproved successfully.",
      });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk unapproving users:', error);
      toast.error("Error", {
        description: "Failed to unapprove some users. Please try again.",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchLower) ||
      user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
      user.user_metadata?.username?.toLowerCase().includes(searchLower);
    
    const matchesCompany = 
      companyFilter === 'all' || user.user_metadata?.role === companyFilter;
    
    const matchesApproval = 
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && user.is_approved) ||
      (approvalFilter === 'unapproved' && !user.is_approved);

    return matchesSearch && matchesCompany && matchesApproval;
  });

  const uniqueCompanies = Array.from(new Set(users.map(user => user.user_metadata?.role)));

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === 'created_at') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, permissions, and access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by email, name, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Label htmlFor="company">Company</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label htmlFor="approval">Approval Status</Label>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="unapproved">Unapproved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={handleBulkApprove}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Approve Selected
                </Button>
                <Button onClick={handleBulkUnapprove} variant="destructive">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Unapprove Selected
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    Joined {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.user_metadata?.full_name || 'N/A'}</span>
                        <span className="text-sm text-muted-foreground">{user.user_metadata?.username || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.user_metadata?.role || 'N/A'}</TableCell>
                    <TableCell>
                      <select
                        value={user.user_metadata?.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="p-1 border rounded"
                        disabled={user.user_metadata?.role === 'admin'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.is_approved ? "default" : "destructive"}
                        className={user.is_approved ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {user.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{getTimeAgo(user.created_at)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!user.is_approved ? (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUnapprove(user.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Unapprove
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToDelete(user.id)}
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
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 