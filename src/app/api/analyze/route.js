export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
    console.log('Anthropic response:', rawText)

    const data = JSON.parse(rawText)
    return Response.json(data)
  } catch (e) {
    console.log('Catch error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
