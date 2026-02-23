import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateMastercardVisit } from "@/hooks/useMastercardVisits";
import { useAuth } from "@/hooks/useAuth";

const tierOptions = ["Black Card", "World Elite", "Platinum", "Standard"] as const;
const purposeOptions = ["Tour", "Spa Day", "Fitness", "Dining", "Event", "Other"] as const;

const schema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().optional(),
  client_phone: z.string().optional(),
  mastercard_tier: z.enum(tierOptions).optional(),
  visit_date: z.string().min(1, "Visit date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  number_of_guests: z.coerce.number().min(0).default(0),
  visit_purpose: z.enum(purposeOptions).optional(),
  service_preferences: z.string().optional(),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddMastercardVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toISOTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}

export function AddMastercardVisitDialog({ open, onOpenChange }: AddMastercardVisitDialogProps) {
  const { user } = useAuth();
  const createVisit = useCreateMastercardVisit();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: "",
      client_email: "",
      client_phone: "",
      mastercard_tier: undefined,
      visit_date: "",
      start_time: "",
      end_time: "",
      number_of_guests: 0,
      visit_purpose: undefined,
      service_preferences: "",
      special_requests: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const start_time = toISOTime(values.visit_date, values.start_time);
    const end_time = values.end_time
      ? toISOTime(values.visit_date, values.end_time)
      : null;

    await createVisit.mutateAsync({
      visit_date: values.visit_date,
      start_time,
      end_time,
      client_name: values.client_name || null,
      client_email: values.client_email || null,
      client_phone: values.client_phone || null,
      mastercard_tier: values.mastercard_tier ?? null,
      number_of_guests: values.number_of_guests ?? 0,
      assigned_concierge: null,
      service_preferences: values.service_preferences || null,
      special_requests: values.special_requests || null,
      visit_purpose: values.visit_purpose ?? null,
      notes: values.notes || null,
      status: "scheduled",
      created_by: user?.id ?? null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Mastercard Visit</DialogTitle>
          <DialogDescription>
            Schedule a new Mastercard client visit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mastercard_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mastercard Tier</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tierOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visit_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number_of_guests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Guests</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? 0}
                      onChange={(e) => {
                        const n = e.target.valueAsNumber;
                        field.onChange(Number.isNaN(n) ? 0 : n);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visit_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Purpose</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {purposeOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service_preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Preferences</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createVisit.isPending}>
                {createVisit.isPending ? "Creating..." : "Create Visit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
