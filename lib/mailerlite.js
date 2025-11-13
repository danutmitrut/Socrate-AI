/**
 * Add subscriber to Mailerlite
 */
export async function addToMailerlite(email, name = '') {
  if (!process.env.MAILERLITE_API_KEY) {
    console.warn('Mailerlite API key not configured');
    return { success: false, error: 'Mailerlite not configured' };
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        fields: {
          name: name || email.split('@')[0]
        },
        groups: process.env.MAILERLITE_GROUP_ID ? [process.env.MAILERLITE_GROUP_ID] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailerlite error:', errorData);
      return { success: false, error: errorData.message || 'Failed to add subscriber' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Mailerlite API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update subscriber status in Mailerlite (e.g., when they upgrade to paid)
 */
export async function updateMailerliteSubscriber(email, fields = {}) {
  if (!process.env.MAILERLITE_API_KEY) {
    console.warn('Mailerlite API key not configured');
    return { success: false };
  }

  try {
    // First, get the subscriber ID
    const searchResponse = await fetch(
      `https://connect.mailerlite.com/api/subscribers?filter[email]=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      return { success: false };
    }

    const searchData = await searchResponse.json();
    const subscriber = searchData.data?.[0];

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' };
    }

    // Update the subscriber
    const updateResponse = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${subscriber.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ fields })
      }
    );

    if (!updateResponse.ok) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Mailerlite update error:', error);
    return { success: false, error: error.message };
  }
}
