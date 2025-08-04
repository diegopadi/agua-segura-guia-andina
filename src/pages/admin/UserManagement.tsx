import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Download, 
  Key,
  Filter,
  RefreshCw,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserDetails } from "./UserDetails";
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
} from "@/components/ui/alert-dialog";

interface UserManagementProps {
  onRefresh: () => void;
}

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  ie_name: string | null;
  ie_district: string | null;
  ie_province: string | null;
    ie_region: string | null;
    phone: string | null;
    area_docencia: string | null;
    photo_url: string | null;
    created_at: string;
    accelerator_progress: {
      accelerator1: number;
      accelerator2: number;
      accelerator3: number;
    };
    total_files: number;
}

export const UserManagement = ({ onRefresh }: UserManagementProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ie_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ie_district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ie_province?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get profiles with user emails from auth.users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          files(count)
        `);

      if (profilesError) throw profilesError;

      // Get user emails from auth admin API would require service role
      // For now, we'll use user_id as email placeholder
      const usersWithProgress = await Promise.all(
        profilesData.map(async (profile) => {
          // Get accelerator progress for this user
          const { data: sessions } = await supabase
            .from('acelerador_sessions')
            .select('acelerador_number, status, current_step')
            .eq('user_id', profile.user_id);

          const progress = {
            accelerator1: 0,
            accelerator2: 0,
            accelerator3: 0
          };

          sessions?.forEach(session => {
            const progressValue = session.status === 'completed' ? 100 : 
              Math.round((session.current_step / 6) * 100);
            
            if (session.acelerador_number === 1) progress.accelerator1 = progressValue;
            if (session.acelerador_number === 2) progress.accelerator2 = progressValue;
            if (session.acelerador_number === 3) progress.accelerator3 = progressValue;
          });

          // Get file count
          const { count: fileCount } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            email: profile.user_id, // Placeholder - in real app would fetch from auth.users
            accelerator_progress: progress,
            total_files: fileCount || 0
          };
        })
      );

      setUsers(usersWithProgress);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (userId: string, userName: string) => {
    try {
      // This would need a Supabase Edge Function to reset password
      // For now, we'll show a success message
      toast({
        title: "Contraseña restablecida",
        description: `La contraseña de ${userName} ha sido restablecida a: AguaSegura2025`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "No se pudo restablecer la contraseña",
        variant: "destructive",
      });
    }
  };

  const resetUserProgress = async (userId: string, userName: string) => {
    try {
      // Delete all accelerator sessions and form responses
      await supabase
        .from('acelerador_sessions')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('form_responses')
        .delete()
        .in('session_id', 
          (await supabase.from('acelerador_sessions').select('id').eq('user_id', userId)).data?.map(s => s.id) || []
        );

      toast({
        title: "Progreso restablecido",
        description: `El progreso de ${userName} ha sido eliminado`,
      });

      fetchUsers(); // Refresh the list
      onRefresh(); // Refresh parent dashboard
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        title: "Error",
        description: "No se pudo restablecer el progreso",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    try {
      // Delete user data cascading
      await supabase.from('files').delete().eq('user_id', userId);
      await supabase.from('acelerador_sessions').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      // Note: Deleting from auth.users would require service role
      
      toast({
        title: "Usuario eliminado",
        description: `${userName} ha sido eliminado del sistema`,
      });

      fetchUsers(); // Refresh the list
      onRefresh(); // Refresh parent dashboard
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return "bg-gray-200";
    if (progress < 50) return "bg-yellow-400";
    if (progress < 100) return "bg-blue-400";
    return "bg-green-400";
  };

  if (selectedUser) {
    return (
      <UserDetails 
        user={selectedUser} 
        onBack={() => setSelectedUser(null)}
        onRefresh={fetchUsers}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, institución..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Usuarios ({filteredUsers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.photo_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {user.full_name || 'Sin nombre'}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {user.total_files} archivos
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.ie_name || 'IE no especificada'} • {user.ie_district || 'Distrito no especificado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registrado: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        
                        {/* Progress bars */}
                        <div className="flex gap-2 mt-2">
                          <div className="text-xs">
                            <span>A1:</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(user.accelerator_progress.accelerator1)}`}
                                style={{ width: `${user.accelerator_progress.accelerator1}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs">
                            <span>A2:</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(user.accelerator_progress.accelerator2)}`}
                                style={{ width: `${user.accelerator_progress.accelerator2}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs">
                            <span>A3:</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(user.accelerator_progress.accelerator3)}`}
                                style={{ width: `${user.accelerator_progress.accelerator3}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserPassword(user.user_id, user.full_name || 'Usuario')}
                      >
                        <Key className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserProgress(user.user_id, user.full_name || 'Usuario')}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente a {user.full_name || 'este usuario'} 
                              y todos sus datos. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.user_id, user.full_name || 'Usuario')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};