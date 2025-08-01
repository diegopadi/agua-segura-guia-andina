import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { WaterLogo } from "@/components/WaterLogo";

const registerSchema = z.object({
  email: z.string().email("Ingrese un email válido"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

type RegisterData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { signUp } = useAuth();

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
    },
  });

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      await signUp(data.email, data.fullName);
      setRegistered(true);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <WaterLogo size={48} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-green-600">¡Registro Exitoso!</CardTitle>
              <CardDescription>
                Su cuenta ha sido creada correctamente
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Confirme su correo electrónico</h3>
              <p className="text-sm text-blue-700 mb-3">
                Hemos enviado un correo de confirmación a <strong>{form.getValues('email')}</strong>
              </p>
              <p className="text-xs text-blue-600">
                Busque un correo de <strong>Supabase Auth &lt;noreply@mail.app.supabase.io&gt;</strong>
                <br />
                Revise también su carpeta de spam o promociones.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Contraseña temporal:</strong> AguaSegura2025
                <br />
                Deberá cambiarla después de confirmar su correo.
              </p>
            </div>

            <Button 
              onClick={onLoginClick}
              className="w-full"
              variant="outline"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <WaterLogo size={48} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Registro de Docente</CardTitle>
            <CardDescription>
              Cree su cuenta para acceder al sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese su nombre completo"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="su.email@ejemplo.com"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Contraseña temporal:</strong> AguaSegura2025
                  <br />
                  Deberá cambiarla en su primer acceso.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Registrando..." : "Registrar Cuenta"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tiene cuenta?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={onLoginClick}
              >
                Iniciar sesión
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}