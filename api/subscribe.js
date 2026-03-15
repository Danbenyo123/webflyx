import crypto from 'crypto';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PIXEL_ID = '738018122591014';

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { email, eventId } = req.body;

    // ... your existing email/newsletter logic here ...

    // Send to Meta CAPI
    try {
        await fetch(
            `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: [{
                        event_name: 'Lead',
                        event_time: Math.floor(Date.now() / 1000),
                        event_id: eventId,
                        action_source: 'website',
                        user_data: {
                            em: [sha256(email.toLowerCase().trim())]
                        }
                    }],
                    access_token: META_ACCESS_TOKEN
                })
            }
        );
    } catch (e) {
        console.error('CAPI error:', e);
        // Don't fail the signup if CAPI fails
    }

    res.status(200).json({ ok: true });
}

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
