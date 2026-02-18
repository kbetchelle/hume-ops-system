import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface SubmitReportRequest {
  reportDate: string;
  shiftTime: 'AM' | 'PM';
  formData: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { reportDate, shiftTime, formData } = await req.json() as SubmitReportRequest;

    if (!reportDate || !shiftTime) {
      return new Response(
        JSON.stringify({ error: 'reportDate and shiftTime are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Submit Report] Processing ${shiftTime} shift for ${reportDate} by user ${user.id}`);

    // Check if report already exists
    const { data: existing } = await supabase
      .from('daily_report_history')
      .select('id, status')
      .eq('report_date', reportDate)
      .eq('shift_type', shiftTime)
      .maybeSingle();

    if (existing && existing.status === 'submitted') {
      return new Response(
        JSON.stringify({ error: 'Report already submitted for this shift' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare report data
    const reportPayload = {
      report_date: reportDate,
      shift_type: shiftTime,
      staff_user_id: user.id,
      staff_name: formData.staffName || user.user_metadata?.full_name || user.email,
      member_feedback: formData.memberFeedback || [],
      membership_requests: formData.membershipCancelRequests || [],
      celebratory_events: formData.celebratoryEvents || [],
      tour_notes: formData.tours || [],
      facility_issues: formData.facilityIssues || [],
      busiest_areas: formData.busiestAreas || '',
      system_issues: formData.systemIssues || [],
      management_notes: formData.managementNotes || '',
      future_shift_notes: formData.futureNotes || [],
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      celebratory_events_na: formData.celebratoryEventsNA || false,
      system_issues_na: formData.systemIssuesNA || false,
      future_shift_notes_na: formData.futureShiftNotesNA || false,
    };

    // Insert or update main report
    let reportId: string;
    if (existing) {
      const { data, error } = await supabase
        .from('daily_report_history')
        .update(reportPayload)
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) throw error;
      reportId = data.id;
      console.log('[Submit Report] Updated existing report:', reportId);
    } else {
      const { data, error } = await supabase
        .from('daily_report_history')
        .insert([reportPayload])
        .select('id')
        .single();

      if (error) throw error;
      reportId = data.id;
      console.log('[Submit Report] Created new report:', reportId);
    }

    // Cascade to tracker tables
    const staffName = formData.staffName || user.user_metadata?.full_name || user.email;

    // 1. Celebratory events tracker
    if (formData.celebratoryEvents && formData.celebratoryEvents.length > 0) {
      const celebratoryEventsToInsert = formData.celebratoryEvents.map((event: any) => ({
        member_name: event.memberName,
        event_type: event.eventType,
        event_date: event.date || null,
        reported_date: reportDate,
        reported_by: staffName,
        shift_type: shiftTime,
      }));

      const { error: eventsError } = await supabase
        .from('celebratory_events')
        .insert(celebratoryEventsToInsert);

      if (eventsError) {
        console.error('[Submit Report] Failed to insert celebratory events:', eventsError);
      } else {
        console.log(`[Submit Report] Inserted ${celebratoryEventsToInsert.length} celebratory events`);
      }
    }

    // 2. Facility issues tracker (with 48-hour deduplication)
    if (formData.facilityIssues && formData.facilityIssues.length > 0) {
      for (const issue of formData.facilityIssues) {
        if (!issue.description) continue;

        try {
          await supabase
            .from('facility_issues_tracker')
            .insert({
              description: issue.description,
              photo_url: issue.photoUrl || null,
              reported_date: reportDate,
              reported_by: staffName,
              shift_type: shiftTime,
              status: 'open',
            });
          console.log('[Submit Report] Inserted facility issue');
        } catch (error: unknown) {
          // Ignore duplicate key errors (deduplication working)
          if (!(error instanceof Error) || !error.message?.includes('duplicate key')) {
            console.error('[Submit Report] Failed to insert facility issue:', error);
          } else {
            console.log('[Submit Report] Facility issue already exists (deduplication)');
          }
        }
      }
    }

    // 3. System issues / FOH Q&A
    if (formData.systemIssues && formData.systemIssues.length > 0) {
      const fohQuestionsToInsert = formData.systemIssues
        .filter((issue: any) => issue.issueType && issue.description)
        .map((issue: any) => ({
          issue_type: issue.issueType,
          description: issue.description,
          photo_url: issue.photoUrl || null,
          reported_date: reportDate,
          reported_by: staffName,
          shift_type: shiftTime,
          resolved: false,
        }));

      if (fohQuestionsToInsert.length > 0) {
        const { error: questionsError } = await supabase
          .from('foh_questions')
          .insert(fohQuestionsToInsert);

        if (questionsError) {
          console.error('[Submit Report] Failed to insert FOH questions:', questionsError);
        } else {
          console.log(`[Submit Report] Inserted ${fohQuestionsToInsert.length} FOH questions`);
        }
      }
    }

    // Delete draft from concierge_drafts
    const { error: deleteError } = await supabase
      .from('concierge_drafts')
      .delete()
      .eq('report_date', reportDate)
      .eq('shift_time', shiftTime);

    if (deleteError) {
      console.error('[Submit Report] Failed to delete draft:', deleteError);
      // Don't fail the request if draft deletion fails
    } else {
      console.log('[Submit Report] Deleted draft');
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        message: 'Report submitted successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Submit Report] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
