import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch packages that are pending pickup and arrived 3+ days ago
    const { data: packages, error: fetchError } = await supabase
      .from('packages')
      .select('id, tracking_code, recipient_user_id, recipient_name, current_location, arrived_at')
      .eq('status', 'pending_pickup')
      .lt('arrived_at', threeDaysAgo.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch packages: ${fetchError.message}`);
    }

    const results = {
      reminders_sent: 0,
      escalations_sent: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const pkg of packages || []) {
      try {
        const arrivedAt = new Date(pkg.arrived_at);
        const daysWaiting = Math.floor((now.getTime() - arrivedAt.getTime()) / (24 * 60 * 60 * 1000));

        // Only send to users with accounts
        if (!pkg.recipient_user_id) {
          results.skipped++;
          continue;
        }

        if (daysWaiting >= 7) {
          // Escalate to management after 7 days
          // Get all managers/admins
          const { data: managers, error: managersError } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['admin', 'manager']);

          if (managersError) {
            throw new Error(`Failed to fetch managers: ${managersError.message}`);
          }

          // Send escalation notifications to each manager
          const managerNotifications = (managers || []).map((manager) => ({
            user_id: manager.user_id,
            type: 'package_unclaimed',
            title: 'Package Unclaimed for 7+ Days',
            body: `Package ${pkg.tracking_code} has been waiting at ${pkg.current_location} for ${daysWaiting} days. Recipient: ${pkg.recipient_name || 'Unknown'}`,
            data: { packageId: pkg.id, daysWaiting }
          }));

          if (managerNotifications.length > 0) {
            const { error: notifError } = await supabase
              .from('staff_notifications')
              .insert(managerNotifications);

            if (notifError) {
              throw new Error(`Failed to send escalation: ${notifError.message}`);
            }

            results.escalations_sent += managerNotifications.length;
          }
        }

        // Send reminder to recipient (for both 3+ days and 7+ days)
        const { error: reminderError } = await supabase
          .from('staff_notifications')
          .insert({
            user_id: pkg.recipient_user_id,
            type: 'package_reminder',
            title: 'Package Waiting for Pickup',
            body: `Your package (tracking: ${pkg.tracking_code}) has been waiting at ${pkg.current_location} for ${daysWaiting} days. Please pick it up soon.`,
            data: { packageId: pkg.id, daysWaiting }
          });

        if (reminderError) {
          throw new Error(`Failed to send reminder: ${reminderError.message}`);
        }

        results.reminders_sent++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Package ${pkg.tracking_code}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        total_packages_checked: (packages || []).length,
        timestamp: now.toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
