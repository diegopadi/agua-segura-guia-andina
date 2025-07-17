import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'change-password' | 'profile' | 'authenticated'>('login');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      if (!user) {
        setAuthStep('login');
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
        .eq('id', user.id)
        .single();

      const isProfileComplete = profile && 
        profile.full_name && 
        profile.ie_name && 
        profile.terms_accepted_at;

      setProfileExists(isProfileComplete);

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