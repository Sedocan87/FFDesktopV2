
// freelance-flow/api/activate.js

export default async function handler(request, response) {
  // 1. Check if the request method is POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Check for the internal authorization header
  const internalAuthToken = process.env.INTERNAL_API_KEY;
  const requestAuthToken = request.headers.authorization?.split(' ')[1];

  if (!internalAuthToken || requestAuthToken !== internalAuthToken) {
    return response.status(401).json({ message: 'Unauthorized' });
  }

  // 3. Get keys from environment variables and request body
  const lemonSqueezyApiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const { licenseKey, instanceId } = request.body;

  if (!lemonSqueezyApiKey) {
    return response.status(500).json({ message: 'Server configuration error: Missing Lemon Squeezy API key.' });
  }

  if (!licenseKey || !instanceId) {
    return response.status(400).json({ message: 'Bad Request: Missing licenseKey or instanceId.' });
  }

  // 4. Call the Lemon Squeezy API
  try {
    const lemonSqueezyResponse = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${lemonSqueezyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_id: instanceId,
      }),
    });

    const data = await lemonSqueezyResponse.json();

    // 5. Return the response from Lemon Squeezy to the desktop app
    return response.status(lemonSqueezyResponse.status).json(data);

  } catch (error) {
    console.error('Error activating license:', error);
    return response.status(500).json({ message: 'An internal server error occurred.' });
  }
}
