import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MeetingRequest {
  title: string
  startDateTime: string
  endDateTime: string
  subject: string
  bodyContent?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, startDateTime, endDateTime, subject, bodyContent } = await req.json() as MeetingRequest

    // Get Microsoft Graph credentials from environment
    const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID')
    const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET')
    const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID')

    if (!clientId || !clientSecret || !tenantId) {
      console.error('Missing Microsoft Graph credentials')
      return new Response(
        JSON.stringify({ error: 'Microsoft Graph credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating Teams meeting with credentials configured')

    // Get OAuth token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error('Token request failed:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to get access token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    console.log('Access token obtained successfully')

    // Get the user principal name (email) from environment or use a default admin user
    const adminUserEmail = Deno.env.get('MICROSOFT_ADMIN_USER_EMAIL') || 'admin@yourdomain.com'
    
    // Create Teams meeting
    const meetingData = {
      subject: title,
      body: {
        contentType: 'HTML',
        content: bodyContent || subject,
      },
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    }

    const createMeetingResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${adminUserEmail}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    })

    if (!createMeetingResponse.ok) {
      const meetingError = await createMeetingResponse.text()
      console.error('Meeting creation failed:', meetingError)
      return new Response(
        JSON.stringify({ error: 'Failed to create Teams meeting' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const meetingResult = await createMeetingResponse.json()
    console.log('Teams meeting created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        joinUrl: meetingResult.onlineMeeting?.joinUrl || '',
        meetingId: meetingResult.id,
        webLink: meetingResult.webLink,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-teams-meeting function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})