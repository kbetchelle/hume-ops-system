import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConciergeSidebar, type ConciergeView } from "@/components/concierge/ConciergeSidebar";
import { ConciergeBottomNav } from "@/components/concierge/ConciergeBottomNav";
import { ConciergeHeader } from "@/components/concierge/ConciergeHeader";
import { ConciergeHomeView } from "@/components/concierge/ConciergeHomeView";

export default function ConciergeDashboard() {
  const [activeView, setActiveView] = useState<ConciergeView>("home");
  const isMobile = useIsMobile();

  // Placeholder for unread message count - will be replaced with real data
  const unreadCount = 3;

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return <ConciergeHomeView onNavigate={setActiveView} />;
      case "report":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Shift Report
            </h2>
            <p className="text-xs text-muted-foreground">
              Shift report form coming soon...
            </p>
          </div>
        );
      case "messages":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Messages
            </h2>
            <p className="text-xs text-muted-foreground">
              Member communications hub coming soon...
            </p>
          </div>
        );
      case "announcements":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Announcements
            </h2>
            <p className="text-xs text-muted-foreground">
              Announcements feed coming soon...
            </p>
          </div>
        );
      case "whos-working":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Who's Working
            </h2>
            <p className="text-xs text-muted-foreground">
              Staff schedule view coming soon...
            </p>
          </div>
        );
      case "templates":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Response Templates
            </h2>
            <p className="text-xs text-muted-foreground">
              Email templates coming soon...
            </p>
          </div>
        );
      case "quick-links":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Quick Links
            </h2>
            <p className="text-xs text-muted-foreground">
              Quick links coming soon...
            </p>
          </div>
        );
      case "knowledge-base":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Knowledge Base
            </h2>
            <p className="text-xs text-muted-foreground">
              Knowledge base coming soon...
            </p>
          </div>
        );
      case "lost-found":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Lost & Found
            </h2>
            <p className="text-xs text-muted-foreground">
              Lost & found tracker coming soon...
            </p>
          </div>
        );
      case "documents":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Documents
            </h2>
            <p className="text-xs text-muted-foreground">
              Document library coming soon...
            </p>
          </div>
        );
      case "policies-qa":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Policies & Q&A
            </h2>
            <p className="text-xs text-muted-foreground">
              Policies and FAQ coming soon...
            </p>
          </div>
        );
      default:
        return <ConciergeHomeView onNavigate={setActiveView} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <ConciergeHeader />
        
        <div className="flex flex-1 w-full">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <ConciergeSidebar
              activeView={activeView}
              onViewChange={setActiveView}
              unreadCount={unreadCount}
            />
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto ${isMobile ? "pb-20" : ""}`}>
            {renderContent()}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <ConciergeBottomNav
            activeView={activeView}
            onViewChange={setActiveView}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
