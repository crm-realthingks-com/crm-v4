
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityEvent {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, details } = await req.json() as { 
      action: string;
      details: SecurityEvent;
    }

    // Enhanced security monitoring logic
    const securityChecks = {
      'DATA_EXPORT': async (event: SecurityEvent) => {
        // Check for suspicious bulk exports
        if (event.details?.record_count > 1000) {
          return {
            severity: 'high' as const,
            alert: 'Large data export detected',
            action_required: 'Review export request'
          }
        }
        return { severity: 'low' as const }
      },

      'BULK_DELETE': async (event: SecurityEvent) => {
        // Always flag bulk deletes as high severity
        return {
          severity: 'critical' as const,
          alert: 'Bulk delete operation detected',
          action_required: 'Immediate review required'
        }
      },

      'ADMIN_ACTION': async (event: SecurityEvent) => {
        // Log all admin actions
        return {
          severity: 'medium' as const,
          alert: 'Administrative action performed',
          action_required: 'Log for audit'
        }
      },

      'FAILED_ACCESS': async (event: SecurityEvent) => {
        // Check for repeated failed access attempts
        const { data: recentFailures } = await supabaseClient
          .from('security_audit_log')
          .select('*')
          .eq('user_id', user.id)
          .eq('action', 'DATA_ACCESS_FAILED')
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
          .limit(5)

        if (recentFailures && recentFailures.length >= 3) {
          return {
            severity: 'high' as const,
            alert: 'Multiple failed access attempts detected',
            action_required: 'Possible unauthorized access attempt'
          }
        }

        return { severity: 'medium' as const }
      }
    }

    // Process security event
    const checkFunction = securityChecks[action as keyof typeof securityChecks]
    let securityResult = { severity: 'low' as const }
    
    if (checkFunction) {
      securityResult = await checkFunction(details)
    }

    // Log the security event with enhanced metadata
    const { error: logError } = await supabaseClient
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: action,
        resource_type: details.resource_type,
        resource_id: details.resource_id,
        details: {
          ...details.details,
          security_analysis: securityResult,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        }
      })

    if (logError) {
      console.error('Failed to log security event:', logError)
    }

    // Send alerts for high/critical severity events
    if (securityResult.severity === 'high' || securityResult.severity === 'critical') {
      console.log(`SECURITY ALERT [${securityResult.severity.toUpperCase()}]:`, {
        user: user.email,
        action: action,
        alert: securityResult.alert,
        action_required: securityResult.action_required
      })
      
      // In a production environment, you would send notifications here
      // (email, Slack, etc.)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        severity: securityResult.severity,
        message: securityResult.alert || 'Security event logged'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Security monitoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
