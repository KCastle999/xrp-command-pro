export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { prompt } = await request.json()
    
    const key = process.env.API_KEY_ANTHROPIC
    console.log('Key exists:', !!key)
    console.log('Key length:', key?.length)
    console.log('Key prefix:', key?.substring(0, 15))

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const rawText = await res.text()
    console.log('Anthropic status:', res.status)
    console.log('Anthropic response:', rawText.substring(0, 200))

    const data = JSON.parse(rawText)
    return Response.json(data)
  } catch (e) {
    console.log('Catch error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
