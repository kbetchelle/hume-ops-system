import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { toast } from "sonner";
import humeLogo from "@/assets/hume-logo.png";
import { MembersSidebar } from "./MembersSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";

interface MembersLayoutProps {
  children: ReactNode;
  title: string;
}

function MembersHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
      navigate("/");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <img 
            src={humeLogo} 
            alt="Hume" 
            className="h-4 w-auto cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => navigate("/dashboard")}
          />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-[10px] uppercase tracking-widest font-normal">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <RoleSwitcher variant="header" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="text-[10px] uppercase tracking-widest">
                  {getInitials(profile?.full_name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-none border-border bg-background" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-[10px] uppercase tracking-widest font-normal">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-[10px] tracking-wide text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={() => navigate("/dashboard/profile")}
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <User className="mr-2 h-3 w-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/dashboard/settings")}
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <Settings className="mr-2 h-3 w-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function MembersLayout({ children, title }: MembersLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MembersSidebar />
        <div className="flex flex-col flex-1">
          <MembersHeader title={title} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
