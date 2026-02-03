import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";
import { CafeChecklistView } from "@/components/checklists/cafe/CafeChecklistView";
import { Card, CardContent } from "@/components/ui/card";

export default function MyChecklistsPage() {
  const { user } = useAuthContext();
  const { data: roles = [] } = useUserRoles(user?.id);
  
  // Determine which view to show based on user role
  const isConcierge = roles.some(r => r.role === 'concierge');
  const isBoH = roles.some(r => ['floater', 'male_spa_attendant', 'female_spa_attendant'].includes(r.role));
  const isCafe = roles.some(r => r.role === 'cafe');
  
  return (
    <DashboardLayout title="My Checklists">
      {isConcierge && <ConciergeChecklistView />}
      {isBoH && <BoHChecklistView />}
      {isCafe && <CafeChecklistView />}
      
      {!isConcierge && !isBoH && !isCafe && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No checklists available for your role.</p>
            <p className="text-sm mt-2">Contact your manager if you should have access to checklists.</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
