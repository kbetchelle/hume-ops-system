import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import humeLogo from "@/assets/hume-logo.png";

const STAY_SIGNED_IN_KEY = "hume_stay_signed_in";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staySignedIn: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      staySignedIn: localStorage.getItem(STAY_SIGNED_IN_KEY) !== "false",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Store the preference
      localStorage.setItem(STAY_SIGNED_IN_KEY, String(data.staySignedIn));
      
      // If not staying signed in, set a session marker
      if (!data.staySignedIn) {
        sessionStorage.setItem("hume_session_only", "true");
      } else {
        sessionStorage.removeItem("hume_session_only");
      }

      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <img src={humeLogo} alt="Hume" className="h-20 w-auto object-contain" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" className="bg-transparent" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] tracking-wide" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link 
                      to="/forgot-password" 
                      className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 font-medium"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="bg-transparent pr-10" 
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] tracking-wide" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staySignedIn"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-[10px] uppercase tracking-widest font-normal cursor-pointer">
                    Stay signed in
                  </FormLabel>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Signing in
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Google sign-in temporarily disabled */}
          </form>
        </Form>

        <p className="text-xs text-center uppercase tracking-widest text-muted-foreground font-medium">
          No account?{" "}
          <Link to="/signup" className="underline underline-offset-4 hover:opacity-70 transition-opacity duration-300 text-foreground">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}