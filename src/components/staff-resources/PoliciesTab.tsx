import { useMemo } from "react";
import { Inbox } from "lucide-react";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sort_order: number;
  last_updated_by: string | null;
  updated_at: string;
}

export function PoliciesTab({
  policies,
  isLoading,
  searchTerm,
}: {
  policies: Policy[];
  isLoading: boolean;
  searchTerm: string;
}) {
  const filtered = useMemo(() => {
    if (!searchTerm) return policies;
    const q = searchTerm.toLowerCase();
    return policies.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [policies, searchTerm]);

  const policiesByCategory = useMemo(() => {
    return filtered.reduce(
      (acc, policy) => {
        const cat = policy.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(policy);
        return acc;
      },
      {} as Record<string, Policy[]>
    );
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (Object.keys(policiesByCategory).length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm
              ? "No policies match your search."
              : "No policies available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (
        <div key={category}>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {category}
          </h4>
          {categoryPolicies.map((policy) => (
            <AccordionItem key={policy.id} value={policy.id} className="border mb-1">
              <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                {policy.title}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {policy.content}
                </p>
                <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t">
                  Last updated by {policy.last_updated_by} &bull;{" "}
                  {format(parseISO(policy.updated_at), "MMM d, yyyy")}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </div>
      ))}
    </Accordion>
  );
}
