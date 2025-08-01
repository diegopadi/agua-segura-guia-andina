import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  area_docencia: z.string().min(1, "El área de docencia es requerida"),
  ie_name: z.string().min(1, "El nombre de la I.E. es requerido"),
  ie_district: z.string().min(1, "El distrito es requerido"),
  ie_province: z.string().min(1, "La provincia es requerida"),
  ie_region: z.string().min(1, "La región es requerida"),
  ie_country: z.string().default("Perú"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  language: z.string().default("Español"),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),
});

type ProfileData = z.infer<typeof profileSchema>;

const REGIONS = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
  "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
  "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura",
  "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
];

interface ProfileFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function ProfileForm({ onSuccess, initialData }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      area_docencia: initialData?.area_docencia || "",
      ie_name: initialData?.ie_name || "",
      ie_district: initialData?.ie_district || "",
      ie_province: initialData?.ie_province || "",
      ie_region: initialData?.ie_region || "",
      ie_country: initialData?.ie_country || "Perú",
      phone: initialData?.phone || "",
      language: initialData?.language || "Español",
      terms_accepted: false,
    },
  });

  const onSubmit = async (data: ProfileData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: data.full_name,
          area_docencia: data.area_docencia,
          ie_name: data.ie_name,
          ie_district: data.ie_district,
          ie_province: data.ie_province,
          ie_region: data.ie_region,
          ie_country: data.ie_country,
          phone: data.phone,
          language: data.language,
          terms_accepted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Su información ha sido guardada exitosamente",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Complete su Perfil de Docente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area_docencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área de Docencia</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Matemáticas, Ciencias, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono/Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="999-999-999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Institution Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Institución Educativa</h3>
              
              <FormField
                control={form.control}
                name="ie_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la I.E.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ie_region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Región</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione región" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ie_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ie_district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distrito</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ie_country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Perú">Perú</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idioma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Español">Español</SelectItem>
                      <SelectItem value="Quechua" disabled>
                        Quechua (próximamente)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="terms_accepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Acepto los términos y condiciones y la política de privacidad
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Perfil"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}