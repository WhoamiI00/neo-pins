import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArcjetResponse {
  conclusion: 'ALLOW' | 'DENY' | 'CHALLENGE'
  reason: string
  ruleResults: Array<{
    ttl: number
    state: string
    conclusion: 'ALLOW' | 'DENY' | 'CHALLENGE'
    reason: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const arcjetKey = Deno.env.get('ARCJET_KEY')
    if (!arcjetKey) {
      throw new Error('ARCJET_KEY not configured')
    }

    const { ip, userAgent, path } = await req.json()
    
    console.log(`Bot protection check for IP: ${ip}, Path: ${path}`)

    // Call Arcjet API for bot protection
    const arcjetResponse = await fetch('https://api.arcjet.com/v1/decide', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${arcjetKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip,
        method: 'GET',
        path,
        headers: {
          'user-agent': userAgent
        },
        // Configure bot protection rules
        rules: [
          {
            type: 'bot',
            mode: 'LIVE',
            allow: [
              'CATEGORY:SEARCH_ENGINE',
              'CATEGORY:PREVIEW',
              'CATEGORY:MONITOR'
            ]
          },
          {
            type: 'rate-limit',
            mode: 'LIVE',
            characteristics: ['ip'],
            window: '1m',
            max: 100
          }
        ]
      })
    })

    if (!arcjetResponse.ok) {
      throw new Error(`Arcjet API error: ${arcjetResponse.status}`)
    }

    const result: ArcjetResponse = await arcjetResponse.json()
    
    console.log(`Arcjet decision: ${result.conclusion}, Reason: ${result.reason}`)

    return new Response(
      JSON.stringify({
        allowed: result.conclusion === 'ALLOW',
        conclusion: result.conclusion,
        reason: result.reason,
        ruleResults: result.ruleResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Bot protection error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Bot protection check failed',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})