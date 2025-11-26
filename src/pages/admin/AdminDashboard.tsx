import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, BarChart3, Activity } from "lucide-react";
import { UserManagement } from "./UserManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  completedAccelerator1: number;
  completedAccelerator2: number;
  completedAccelerator3: number;
  totalFiles: number;
  recentActivity: Array<{
    user_name: string;
    action: string;
    created_at: string;
  }>;
}

export const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedAccelerator1: 0,
    completedAccelerator2: 0,
    completedAccelerator3: 0,
    totalFiles: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Use the admin function to get all users data
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-get-users', {
        body: {}
      });

      if (usersError) {
        console.error('Error fetching users via admin function:', usersError);
      } else if (usersData?.users) {
        setStats(prev => ({ ...prev, totalUsers: usersData.users.length }));
        
        // Calculate accelerator completions from user data
        const acelerador1Completed = usersData.users.filter((u: any) => u.acelerador1_progress === 'completed').length;
        const acelerador2Completed = usersData.users.filter((u: any) => u.acelerador2_progress === 'completed').length;
        const acelerador3Completed = usersData.users.filter((u: any) => u.acelerador3_progress === 'completed').length;

        setStats(prev => ({
          ...prev,
          totalUsers: usersData.users.length,
          activeUsers: usersData.users.length,
          completedAccelerator1: acelerador1Completed,
          completedAccelerator2: acelerador2Completed,
          completedAccelerator3: acelerador3Completed,
          totalFiles: usersData.users.reduce((sum: number, user: any) => sum + user.total_files, 0)
        }));

        // Create recent activity from user data (last 5 users by creation date)
        const recentUsers = usersData.users
          .slice(0, 5)
          .map((user: any) => ({
            user_name: user.full_name || 'Usuario sin nombre',
            action: 'Registro de cuenta',
            created_at: user.created_at
          }));
        
        setStats(prev => ({ ...prev, recentActivity: recentUsers }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Mi Cole con Agua Segura</p>
        </div>
        <Button 
          variant="outline" 
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Actividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acelerador 1</CardTitle>
                <Badge variant="secondary">{stats.completedAccelerator1}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedAccelerator1}</div>
                <p className="text-xs text-muted-foreground">completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acelerador 2</CardTitle>
                <Badge variant="secondary">{stats.completedAccelerator2}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedAccelerator2}</div>
                <p className="text-xs text-muted-foreground">completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acelerador 3</CardTitle>
                <Badge variant="secondary">{stats.completedAccelerator3}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedAccelerator3}</div>
                <p className="text-xs text-muted-foreground">completados</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{activity.user_name}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement onRefresh={fetchDashboardStats} />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Log de Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidad de logs detallados próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};