import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import humeLogo from "@/assets/hume-logo.png";
import { MembersSidebar } from "./MembersSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MembersLayoutProps {
  children: ReactNode;
  title: string;
}

function MembersHeader({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background shrink-0">
      <div className="flex h-20 items-center justify-between px-4 md:px-6">
        <h1 className="text-[18px] uppercase tracking-widest font-normal truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <img
            src={humeLogo}
            alt="Hume"
            className="h-[50px] w-auto cursor-pointer hover:opacity-70 transition-opacity my-[12px]"
            onClick={() => navigate("/dashboard")}
          />
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
        <div className="flex-1 flex flex-col min-w-0">
          <MembersHeader title={title} />
          <main className="flex-1 p-6 overflow-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
