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
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { stripHtml, sanitizeHtml } from "@/lib/utils";

interface Policy {
  id: string;
  content: string;
  category: string | null;
  tags: string[];
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
        p.content.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [policies, searchTerm]);

  const policyIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const { data: policyFlagsMap } = useActiveResourceFlags("club_policy", policyIds);

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
            <ResourceFlagContextMenu
              key={policy.id}
              resourceType="club_policy"
              resourceId={policy.id}
              resourceLabel={`Policy in ${category}`}
              hasPendingFlag={policyFlagsMap?.has(policy.id) ?? false}
            >
              <div data-resource-id={policy.id}>
                <AccordionItem value={policy.id} className="border mb-1">
                  <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                    <span className="flex items-center gap-2 text-left">
                      <span className="line-clamp-1">
                        {stripHtml(policy.content).substring(0, 100)}
                        {stripHtml(policy.content).length > 100 ? '...' : ''}
                      </span>
                      {policyFlagsMap?.has(policy.id) && <UnderReviewBadge />}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div 
                      className="text-xs text-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t">
                      Last updated by {policy.last_updated_by} &bull;{" "}
                      {format(parseISO(policy.updated_at), "MMM d, yyyy")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </div>
            </ResourceFlagContextMenu>
          ))}
        </div>
      ))}
    </Accordion>
  );
}
