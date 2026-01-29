import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Calendar,
  Clock,
  Users,
  Building,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { selectFrom, eq } from "@/lib/dataApi";

interface QuickLink {
  id: string;
  category: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  "alert-triangle": <AlertTriangle className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

export function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<QuickLink>("quick_links", {
      filters: [eq("is_active", true)],
      order: { column: "sort_order", ascending: true },
    });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const groupedLinks = useMemo(() => {
    const groups: Record<string, QuickLink[]> = {};
    links.forEach((link) => {
      if (!groups[link.category]) {
        groups[link.category] = [];
      }
      groups[link.category].push(link);
    });
    return groups;
  }, [links]);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || <Link2 className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-wider font-normal">
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(groupedLinks).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No quick links configured
          </p>
        ) : (
          Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <div key={category}>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categoryLinks.map((link) => (
                  <Button
                    key={link.id}
                    variant="outline"
                    className="h-auto py-3 px-4 rounded-none justify-start gap-3 hover:bg-muted/50"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    {getIcon(link.icon)}
                    <span className="text-xs">{link.title}</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
