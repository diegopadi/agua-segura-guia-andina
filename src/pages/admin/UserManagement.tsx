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
  ie_name: string | null;
  ie_district: string | null;
  ie_province: string | null;
  ie_region: string | null;
  ie_country: string | null;
  phone: string | null;
  area_docencia: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
  acelerador1_progress: string;
  acelerador2_progress: string;
  acelerador3_progress: string;
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
      user.ie_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ie_district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ie_province?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users via admin edge function...');
      
      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        body: {}
      });

      if (error) {
        console.error('Error calling admin-get-users function:', error);
        toast({
          title: "Error",
          description: "Error al cargar los usuarios: " + error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.users) {
        console.log('No users data received from function');
        setUsers([]);
        return;
      }

      console.log(`Received ${data.users.length} users from admin function`);
      setUsers(data.users);
      
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId }
      });

      if (error) {
        console.error('Error calling reset password function:', error);
        toast({
          title: "Error",
          description: "No se pudo restablecer la contraseña: " + error.message,
          variant: "destructive",
        });
        return;
      }

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
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) {
        console.error('Error calling delete user function:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario: " + error.message,
          variant: "destructive",
        });
        return;
      }

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
                        
                        {/* Progress badges */}
                        <div className="flex gap-2 mt-2">
                          <Badge variant={user.acelerador1_progress === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            A1: {user.acelerador1_progress === 'completed' ? 'Completado' : 'Pendiente'}
                          </Badge>
                          <Badge variant={user.acelerador2_progress === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            A2: {user.acelerador2_progress === 'completed' ? 'Completado' : 'Pendiente'}
                          </Badge>
                          <Badge variant={user.acelerador3_progress === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            A3: {user.acelerador3_progress === 'completed' ? 'Completado' : 'Pendiente'}
                          </Badge>
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