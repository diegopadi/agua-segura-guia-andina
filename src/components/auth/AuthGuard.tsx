import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ProfileForm } from "./ProfileForm";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, checkFirstLogin } = useAuth();
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'change-password' | 'profile' | 'email-confirmation' | 'authenticated'>('login');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuthState = async () => {
      if (!user) {
        setAuthStep('login');
        return;
      }

      setUserEmail(user.email || "");

      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        setAuthStep('email-confirmation');
        return;
      }

      // Check if it's first login
      const firstLogin = await checkFirstLogin();
      setIsFirstLogin(firstLogin);

      if (firstLogin) {
        setAuthStep('change-password');
        return;
      }

      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const isProfileComplete = profile && 
        profile.full_name && 
        profile.ie_name && 
        profile.terms_accepted_at;

      setProfileExists(!!isProfileComplete);

      if (!isProfileComplete) {
        setAuthStep('profile');
      } else {
        setAuthStep('authenticated');
      }
    };

    if (!loading) {
      checkAuthState();
    }
  }, [user, loading, checkFirstLogin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (authStep) {
    case 'login':
      return (
        <LoginForm 
          onSuccess={() => setAuthStep('authenticated')}
          onRegisterClick={() => setAuthStep('register')}
        />
      );
    
    case 'register':
      return (
        <RegisterForm 
          onSuccess={() => setAuthStep('login')}
          onLoginClick={() => setAuthStep('login')}
        />
      );
    
    case 'email-confirmation':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
          <div className="w-full max-w-md">
            <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Confirme su correo electrónico</h2>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">
                    Hemos enviado un correo de confirmación a:
                  </p>
                  <p className="font-semibold text-blue-800">{userEmail}</p>
                  <p className="text-xs text-blue-600 mt-3">
                    Busque un correo de <strong>Supabase Auth &lt;noreply@mail.app.supabase.io&gt;</strong>
                    <br />
                    Revise también su carpeta de spam o promociones.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Ya confirmé mi correo
                </Button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'change-password':
      return (
        <ChangePasswordForm 
          onSuccess={() => setAuthStep('profile')}
        />
      );
    
    case 'profile':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
          <ProfileForm 
            onSuccess={() => setAuthStep('authenticated')}
          />
        </div>
      );
    
    case 'authenticated':
      return <>{children}</>;
    
    default:
      return null;
  }
}