import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  issueId: string;
  issueTitle: string;
  issueType: string;
  location: {
    city: string;
    state: string;
    ward?: string;
    area?: string;
    pincode?: string;
  };
  assignedOfficialId?: string;
  citizenPhone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { issueId, issueTitle, issueType, location, assignedOfficialId, citizenPhone }: NotificationRequest = await req.json();

    let notifications = [];

    // Send notification to assigned official
    if (assignedOfficialId) {
      // Get official's contact details
      const { data: official } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .eq('user_id', assignedOfficialId)
        .single();

      if (official) {
        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: official.user_id,
            title: 'New Issue Assigned',
            message: `A new ${issueType.replace('_', ' ')} issue has been assigned to you: ${issueTitle}`,
            notification_type: 'issue_assigned',
            issue_id: issueId
          });

        // Send SMS if Twilio is configured
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (twilioSid && twilioToken && twilioPhone && official.phone) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
            const auth = btoa(`${twilioSid}:${twilioToken}`);
            
            const smsBody = `CivicFix: New issue assigned - ${issueTitle} in ${location.area || location.city}. Check your dashboard: ${Deno.env.get('SITE_URL') || 'https://civicfix.gov.in'}/dashboard`;
            
            const smsResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: official.phone,
                From: twilioPhone,
                Body: smsBody,
              }),
            });

            if (smsResponse.ok) {
              notifications.push({ type: 'sms', status: 'sent', recipient: official.phone });
            }
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            notifications.push({ type: 'sms', status: 'failed', error: smsError.message });
          }
        }

        // Send Email if SendGrid is configured
        const sendGridKey = Deno.env.get('SENDGRID_API_KEY');
        if (sendGridKey) {
          try {
            // Get official's email from auth
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const officialAuth = authUsers.users.find(user => user.id === official.user_id);
            
            if (officialAuth?.email) {
              const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${sendGridKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  personalizations: [{
                    to: [{ email: officialAuth.email }],
                    subject: `New Issue Assigned: ${issueTitle}`,
                  }],
                  from: { 
                    email: 'noreply@civicfix.gov.in',
                    name: 'CivicFix'
                  },
                  content: [{
                    type: 'text/html',
                    value: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #FF9933;">New Civic Issue Assigned</h2>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                          <h3 style="color: #FF9933; margin-top: 0;">Issue Details</h3>
                          <p><strong>Title:</strong> ${issueTitle}</p>
                          <p><strong>Type:</strong> ${issueType.replace('_', ' ').toUpperCase()}</p>
                          <p><strong>Location:</strong> ${location.area ? location.area + ', ' : ''}${location.city}, ${location.state}</p>
                          ${location.ward ? `<p><strong>Ward:</strong> ${location.ward}</p>` : ''}
                          ${location.pincode ? `<p><strong>Pincode:</strong> ${location.pincode}</p>` : ''}
                        </div>
                        <p>Please log in to your CivicFix dashboard to review and take action on this issue.</p>
                        <div style="margin: 20px 0;">
                          <a href="${Deno.env.get('SITE_URL') || 'https://civicfix.gov.in'}/dashboard" 
                             style="background: #FF9933; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Dashboard
                          </a>
                        </div>
                        <p style="color: #666; font-size: 12px;">
                          This is an automated notification from CivicFix. Please do not reply to this email.
                        </p>
                      </div>
                    `
                  }]
                }),
              });

              if (emailResponse.ok) {
                notifications.push({ type: 'email', status: 'sent', recipient: officialAuth.email });
              }
            }
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            notifications.push({ type: 'email', status: 'failed', error: emailError.message });
          }
        }
      }
    }

    // Send confirmation SMS to citizen
    if (citizenPhone) {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioToken && twilioPhone) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const auth = btoa(`${twilioSid}:${twilioToken}`);
          
          const smsBody = `CivicFix: Your issue "${issueTitle}" has been submitted and assigned to a local official. Track progress at ${Deno.env.get('SITE_URL') || 'https://civicfix.gov.in'}/track`;
          
          const smsResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: citizenPhone,
              From: twilioPhone,
              Body: smsBody,
            }),
          });

          if (smsResponse.ok) {
            notifications.push({ type: 'citizen_sms', status: 'sent', recipient: citizenPhone });
          }
        } catch (smsError) {
          console.error('Citizen SMS sending failed:', smsError);
          notifications.push({ type: 'citizen_sms', status: 'failed', error: smsError.message });
        }
      }
    }

    console.log(`Sent ${notifications.length} notifications for issue ${issueId}`);

    return new Response(JSON.stringify({ 
      message: `Processed ${notifications.length} notifications`,
      notifications: notifications,
      issue_id: issueId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
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