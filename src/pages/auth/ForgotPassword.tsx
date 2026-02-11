import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import humeLogo from "@/assets/hume-logo.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { resetPassword } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        toast.success("Password reset email sent");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <img src={humeLogo} alt="Hume" className="h-20 w-auto object-contain" />
        </div>

        {emailSent ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Reset your password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Sending
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-[10px] text-center uppercase tracking-widest text-muted-foreground">
              Remember your password?{" "}
              <Link to="/" className="underline underline-offset-4 hover:opacity-70 transition-opacity duration-300 text-foreground">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
