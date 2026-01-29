import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8">
      <Card className="w-full max-w-md border-0 text-center">
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-sm">Access Denied</CardTitle>
          <CardDescription className="text-xs tracking-wide">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Your current role doesn't have access to this resource.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-8">
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
