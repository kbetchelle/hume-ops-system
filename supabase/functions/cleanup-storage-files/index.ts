import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch pending deletions (limit to 100 per run)
    const { data: queue, error: fetchError } = await supabase
      .from('storage_deletion_queue')
      .select('*')
      .is('processed_at', null)
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch deletion queue: ${fetchError.message}`);
    }

    const results = { deleted: 0, failed: 0, errors: [] as string[] };

    for (const item of queue || []) {
      try {
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from(item.bucket_name)
          .remove([item.file_path]);

        if (deleteError) {
          throw new Error(`Storage deletion failed: ${deleteError.message}`);
        }

        // Mark as processed successfully
        await supabase
          .from('storage_deletion_queue')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', item.id);

        results.deleted++;
      } catch (error) {
        // Log error and mark as processed with error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await supabase
          .from('storage_deletion_queue')
          .update({ 
            error_message: errorMessage,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        results.failed++;
        results.errors.push(`File ${item.file_path}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        total: (queue || []).length,
        timestamp: new Date().toISOString()
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
