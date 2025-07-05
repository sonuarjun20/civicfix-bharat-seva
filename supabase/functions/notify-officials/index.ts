import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyOfficialsRequest {
  issueId: string;
  issueTitle: string;
  issueType: string;
  location: {
    city: string;
    state: string;
    ward?: string;
    area?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { issueId, issueTitle, issueType, location }: NotifyOfficialsRequest = await req.json();

    // Find officials in the same city/area
    const { data: officials, error: officialsError } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, city, state, ward, area')
      .eq('role', 'official')
      .eq('is_verified', true)
      .eq('city', location.city)
      .eq('state', location.state);

    if (officialsError) {
      throw new Error(`Failed to fetch officials: ${officialsError.message}`);
    }

    if (!officials || officials.length === 0) {
      console.log('No verified officials found for this location');
      return new Response(JSON.stringify({ message: 'No officials found' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get email addresses for officials
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch user emails: ${authError.message}`);
    }

    const officialEmails = officials
      .map(official => {
        const authUser = authUsers.users.find(user => user.id === official.user_id);
        return authUser?.email;
      })
      .filter(Boolean);

    if (officialEmails.length === 0) {
      console.log('No official emails found');
      return new Response(JSON.stringify({ message: 'No official emails found' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send notification emails to officials
    const emailPromises = officialEmails.map(email => 
      resend.emails.send({
        from: "CivicFix <noreply@yourdomain.com>",
        to: [email!],
        subject: `New Civic Issue Reported: ${issueTitle}`,
        html: `
          <h2>New Civic Issue Reported in Your Area</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #FF9933; margin-top: 0;">Issue Details</h3>
            <p><strong>Title:</strong> ${issueTitle}</p>
            <p><strong>Type:</strong> ${issueType.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Location:</strong> ${location.area ? location.area + ', ' : ''}${location.city}, ${location.state}</p>
            ${location.ward ? `<p><strong>Ward:</strong> ${location.ward}</p>` : ''}
          </div>
          <p>Please log in to your CivicFix dashboard to review and take action on this issue.</p>
          <div style="margin: 20px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard" 
               style="background: #FF9933; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from CivicFix. Please do not reply to this email.
          </p>
        `,
      })
    );

    const emailResults = await Promise.allSettled(emailPromises);
    
    // Create notifications in database
    const notificationPromises = officials.map(official => 
      supabase
        .from('notifications')
        .insert({
          user_id: official.user_id,
          title: 'New Issue Reported',
          message: `A new ${issueType.replace('_', ' ')} issue has been reported in your area: ${issueTitle}`,
          notification_type: 'issue_assigned',
          issue_id: issueId
        })
    );

    await Promise.allSettled(notificationPromises);

    console.log(`Notified ${officials.length} officials about issue ${issueId}`);

    return new Response(JSON.stringify({ 
      message: `Successfully notified ${officials.length} officials`,
      emailsSent: emailResults.filter(result => result.status === 'fulfilled').length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in notify-officials function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);