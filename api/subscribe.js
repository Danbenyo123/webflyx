export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.MYMARKETING_API_KEY;
  if (!apiKey) {
    console.error('MYMARKETING_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://webapi.mymarketing.co.il/api/groups/350602/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({ email, status: '1' })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('MyMarketing API error:', response.status, text);
      return res.status(502).json({ error: 'Newsletter signup failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('MyMarketing API request failed:', err);
    return res.status(502).json({ error: 'Newsletter signup failed' });
  }
}
