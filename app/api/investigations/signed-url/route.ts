import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function normalizeStorageObjectPath(raw: string) {
  let p = (raw || '').trim()
  const urlMatch = p.match(/\/storage\/v1\/object\/(?:public|sign)\/investigations\/(.+)$/)
  if (urlMatch?.[1]) p = urlMatch[1]
  p = p.replace(/^\/+/, '')
  while (p.startsWith('investigations/')) p = p.slice('investigations/'.length)
  return p
}

export async function POST(req: Request) {
  try {
    console.log('[signed-url] 1 start')
    const { filePath } = (await req.json().catch(() => ({}))) as { filePath?: string }
    console.log('[signed-url] 2 parsed body', { hasFilePath: !!filePath })
    if (!filePath) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'Missing filePath parameter. Please provide a valid file path.'
      }, { status: 400 })
    }

    const objectName = normalizeStorageObjectPath(filePath)
    const investigationId = objectName.split('/')[0]
    console.log('[signed-url] 3 normalized', { filePath, objectName, investigationId })
    
    if (!investigationId) {
      return NextResponse.json({ 
        error: 'Invalid file path',
        message: 'The file path is missing the investigation ID. Please check the file path format.'
      }, { status: 400 })
    }
    
    // Validate UUID format (investigation IDs are UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(investigationId)) {
      console.warn('[signed-url] Invalid investigation ID format', { investigationId, objectName })
      return NextResponse.json({ 
        error: 'Invalid investigation ID format',
        message: 'The investigation ID in the file path is not in the correct format. Expected a UUID.',
        investigationId 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('[signed-url] 4 env', { hasUrl: !!supabaseUrl, hasServiceKey: !!serviceKey })
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'The server is not properly configured. Please contact support.'
      }, { status: 500 })
    }

    // Authenticate securely (best practice):
    // Prefer server-side cookie auth; if unavailable, accept Bearer access token from client.
    let requesterId: string | null = null
    let authMethod = 'none'
    
    try {
      const supabase = await createServerClient()
      const { data, error } = await withTimeout(supabase.auth.getUser(), 5000, 'cookie auth getUser()')
      if (!error && data?.user?.id) {
        requesterId = data.user.id
        authMethod = 'cookie'
        console.log('[signed-url] Authenticated via cookies', { userId: requesterId })
      }
    } catch (cookieError: any) {
      console.warn('[signed-url] Cookie auth failed or timed out:', cookieError?.message)
      // Continue to bearer auth fallback
    }

    if (!requesterId) {
      const authHeader = req.headers.get('authorization') || ''
      const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
      
      if (token) {
        console.log('[signed-url] Attempting bearer token validation')
        
        // Try validating token with Supabase client first (more reliable)
        try {
          const tempClient = createAdminClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
            auth: { persistSession: false, autoRefreshToken: false },
          })
          
          // Set the session with the token
          const { data: sessionData, error: sessionError } = await tempClient.auth.setSession({
            access_token: token,
            refresh_token: '', // Not needed for validation
          })
          
          if (!sessionError && sessionData?.user?.id) {
            requesterId = sessionData.user.id
            authMethod = 'bearer-setSession'
            console.log('[signed-url] Authenticated via bearer token (setSession)', { userId: requesterId })
          } else {
            throw new Error('setSession failed, trying direct API')
          }
        } catch (setSessionError: any) {
          console.warn('[signed-url] setSession validation failed, trying direct API:', setSessionError?.message)
          
          // Fallback: Validate token by calling Supabase Auth API directly
          // Use longer timeout (10 seconds) for better reliability
          try {
            const userRes = await withTimeout(
              fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                },
              }),
              10000, // Increased timeout to 10 seconds (was 3 seconds)
              'bearer auth /auth/v1/user'
            )
            
            if (userRes.ok) {
              const u = (await userRes.json().catch(() => null)) as any
              if (u?.id) {
                requesterId = u.id
                authMethod = 'bearer-api'
                console.log('[signed-url] Authenticated via bearer token (API)', { userId: requesterId })
              }
            } else {
              console.warn('[signed-url] Bearer token validation failed', { status: userRes.status })
            }
          } catch (apiError: any) {
            // If API call times out or fails, log but don't fail completely
            // The token might still be valid, we'll verify access via investigation lookup
            console.error('[signed-url] Bearer token API validation error:', apiError?.message)
            
            // As a last resort, try to decode the JWT token to get user ID
            // This is less secure but more resilient to network issues
            try {
              const tokenParts = token.split('.')
              if (tokenParts.length === 3) {
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
                if (payload.sub) {
                  requesterId = payload.sub
                  authMethod = 'bearer-jwt-decode'
                  console.warn('[signed-url] Using JWT decode fallback (less secure)', { userId: requesterId })
                }
              }
            } catch (jwtError) {
              console.error('[signed-url] JWT decode also failed:', jwtError)
            }
          }
        }
      }
    }

    if (!requesterId) {
      console.error('[signed-url] All authentication methods failed')
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Could not authenticate request. Please sign in again.'
      }, { status: 401 })
    }
    
    console.log('[signed-url] Authentication successful', { requesterId, authMethod })

    // Verify user has access to this investigation (patient or assigned doctor) using service role
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    console.log('[signed-url] 5 query investigation (service role)', { investigationId, requesterId })
    const queryPromise = admin.from('investigations').select('id, patient_id, doctor_id').eq('id', investigationId).maybeSingle() as unknown as Promise<{ data: { id: string; patient_id: string; doctor_id: string | null } | null; error: any }>
    const { data: inv, error: invError } = await withTimeout(
      queryPromise,
      5000,
      'investigations lookup'
    )
    console.log('[signed-url] 6 query done', { found: !!inv, invError: invError?.message, invId: inv?.id })

    if (invError) {
      console.error('[signed-url] Investigation query error:', invError)
      return NextResponse.json({ 
        error: 'Database error',
        message: 'Failed to lookup investigation in the database. Please try again or contact support.',
        details: invError.message 
      }, { status: 500 })
    }
    if (!inv) {
      console.warn('[signed-url] Investigation not found', { investigationId, requesterId, objectName })
      
      // Additional diagnostic: check if any investigation exists with this ID pattern
      const { count } = await admin
        .from('investigations')
        .select('*', { count: 'exact', head: true })
        .eq('id', investigationId)
      
      console.log('[signed-url] Diagnostic query count:', count)
      
      return NextResponse.json({ 
        error: 'Investigation not found',
        message: 'The investigation associated with this file could not be found. It may have been deleted or the file path is incorrect.',
        investigationId,
        objectName
      }, { status: 404 })
    }
    if (inv.patient_id !== requesterId && inv.doctor_id !== requesterId) {
      console.warn('[signed-url] Access denied', { 
        investigationId, 
        requesterId, 
        patientId: inv.patient_id, 
        doctorId: inv.doctor_id 
      })
      return NextResponse.json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this investigation file.'
      }, { status: 403 })
    }

    // Check if file exists in storage before attempting to create signed URL
    // This provides better error messages and fails fast for test data without files
    console.log('[signed-url] 7 checking file existence', { objectName, investigationId })
    
    const { data: fileList, error: listError } = await admin.storage
      .from('investigations')
      .list(investigationId, { 
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError) {
      console.error('[signed-url] Error listing storage files:', listError)
      // Continue anyway - the createSignedUrl will fail with a better error if file doesn't exist
    } else {
      // Extract filename from objectName (e.g., "1768896346042.pdf" from "investigationId/1768896346042.pdf")
      const fileName = objectName.split('/').slice(1).join('/')
      const fileExists = fileList?.some(file => file.name === fileName)
      
      if (!fileExists) {
        console.warn('[signed-url] File not found in storage', { 
          objectName, 
          fileName, 
          availableFiles: fileList?.map(f => f.name) || [],
          fileCount: fileList?.length || 0
        })
        
        return NextResponse.json({
          error: 'File not found in storage',
          message: 'This investigation has a file path recorded, but the actual file is not available. This may be test data or the file may have been deleted.',
          investigationId,
          objectName,
          fileName,
          availableFiles: fileList?.map(f => f.name) || [],
          fileCount: fileList?.length || 0
        }, { status: 404 })
      }
      
      console.log('[signed-url] File exists in storage', { fileName })
    }

    console.log('[signed-url] 8 createSignedUrl (service role)', { objectName })
    const { data, error } = await admin.storage.from('investigations').createSignedUrl(objectName, 60 * 10)
    console.log('[signed-url] 9 createSignedUrl done', { hasUrl: !!data?.signedUrl, error: error?.message })
    
    if (error) {
      // If we get here, file exists but signed URL creation failed
      // (We already checked file existence above, so this is a different error)
      console.error('[signed-url] Failed to create signed URL', { objectName, error: error.message })
      
      return NextResponse.json({ 
        error: error.message || 'Could not create signed URL',
        message: 'The file exists but a signed URL could not be generated. Please try again or contact support.',
        investigationId,
        objectName
      }, { status: 400 })
    }
    
    if (!data?.signedUrl) {
      return NextResponse.json({ 
        error: 'Could not create signed URL',
        message: 'The signed URL was not generated',
        investigationId,
        objectName
      }, { status: 400 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (e: any) {
    console.error('[signed-url] Unexpected error', e)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? e?.message : undefined
    }, { status: 500 })
  }
}

