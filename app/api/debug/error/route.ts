export async function GET() {
  try {
    // Test if problematic modules can be imported
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return Response.json({ 
      status: 'OK', 
      message: 'API route works',
      supabaseConfigured: !!supabaseUrl && !!supabaseKey,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    console.error('DEBUG ERROR:', error)
    
    return Response.json({ 
      status: 'ERROR',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

