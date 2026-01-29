import { format } from "date-fns";
import { Mail, MessageSquare, Phone, StickyNote, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineItem {
  id: string;
  type: string;
  content: string;
  subject?: string | null;
  created_at: string;
  source: "communication" | "note";
}

interface MemberTimelineProps {
  items: TimelineItem[];
  isLoading: boolean;
}

const typeConfig = {
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  note: {
    icon: StickyNote,
    label: "Note",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  call: {
    icon: Phone,
    label: "Call",
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  message: {
    icon: MessageSquare,
    label: "Message",
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
};

export function MemberTimeline({ items, isLoading }: MemberTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          No communications yet for this member.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Start by adding a note or sending an email.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {items.map((item) => {
            const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.note;
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative flex gap-4 pl-2">
                {/* Icon circle */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="text-sm font-medium">{item.subject}</p>
                  )}

                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
