
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Safari-compatible cleanup utility
const cleanupAuthState = () => {
  try {
    if (typeof Storage !== 'undefined' && typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('Failed to remove localStorage key:', key);
          }
        }
      });
    }
    
    if (typeof Storage !== 'undefined' && typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn('Failed to remove sessionStorage key:', key);
          }
        }
      });
    }
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
};

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCheckDone, setUserCheckDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Memoized user check to prevent repeated calls
  const checkUser = useCallback(async () => {
    if (userCheckDone) return;
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        navigate("/");
      }
    } catch (error) {
      console.warn('User check failed:', error);
    } finally {
      setUserCheckDone(true);
    }
  }, [navigate, userCheckDone]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state first - Safari compatible
      cleanupAuthState();
      
      // Add small delay for Safari to process cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Attempt global sign out to clear any existing session
      try {
        await supabase.auth.signOut({ scope: 'global' });
        // Another small delay for Safari
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.warn('Pre-login signout failed:', err);
      }

      // Safari-specific login with extended timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 15000)
        )
      ]) as any;

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Login failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.user && data.session) {
        console.log('Login successful for Safari');
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        
        // Safari-compatible redirect with delay
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      } else {
        throw new Error('No user data received');
      }
    } catch (error: any) {
      console.error('Login process error:', error);
      let errorMessage = "An unexpected error occurred";
      
      if (error.message === 'Login timeout') {
        errorMessage = "Login timed out. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            RealThingks Deals
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sign in to access your deals pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary text-lg py-3" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
