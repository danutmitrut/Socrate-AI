/**
 * Mailersend integration for transactional emails
 * Used for: password reset, subscription notifications, etc.
 */

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetLink) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.warn('Mailersend API key not configured');
    return { success: false, error: 'Mailersend not configured' };
  }

  try {
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILERSEND_FROM_EMAIL || 'noreply@socrate-ai.ro',
          name: 'Socrate AI'
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Resetează-ți parola - Socrate AI',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #2d3748;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #0c5394;
                font-size: 28px;
                margin: 0;
              }
              .content {
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background-color: #0c5394;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #3d84c6;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #718096;
                text-align: center;
              }
              .warning {
                background-color: #fff5f5;
                border-left: 4px solid #fc8181;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SOCRATE AI</h1>
              </div>

              <div class="content">
                <h2 style="color: #2d3748; font-size: 20px;">Resetare Parolă</h2>

                <p>Bună,</p>

                <p>Am primit o cerere de resetare a parolei pentru contul tău Socrate AI.</p>

                <p>Dacă tu ai făcut această cerere, apasă pe butonul de mai jos pentru a-ți reseta parola:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="button">Resetează Parola</a>
                </div>

                <p>Sau copiază și lipește acest link în browser:</p>
                <p style="word-break: break-all; color: #3182ce; font-size: 14px;">${resetLink}</p>

                <div class="warning">
                  <strong>⚠️ Important:</strong> Acest link expiră în <strong>1 oră</strong>.
                </div>

                <p style="margin-top: 30px;">Dacă nu ai solicitat resetarea parolei, poți ignora acest email. Parola ta nu va fi schimbată.</p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Socrate AI. Toate drepturile rezervate.</p>
                <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Resetare Parolă - Socrate AI

Bună,

Am primit o cerere de resetare a parolei pentru contul tău Socrate AI.

Dacă tu ai făcut această cerere, accesează acest link pentru a-ți reseta parola:
${resetLink}

⚠️ IMPORTANT: Acest link expiră în 1 oră.

Dacă nu ai solicitat resetarea parolei, poți ignora acest email. Parola ta nu va fi schimbată.

© ${new Date().getFullYear()} Socrate AI. Toate drepturile rezervate.
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailersend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    const data = await response.json();
    console.log('Password reset email sent to:', email);
    return { success: true, data };

  } catch (error) {
    console.error('Mailersend API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.warn('Mailersend API key not configured');
    return { success: false, error: 'Mailersend not configured' };
  }

  // TODO: Implement welcome email template
  console.log('Welcome email would be sent to:', email);
  return { success: true };
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(email, subscriptionType) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.warn('Mailersend API key not configured');
    return { success: false, error: 'Mailersend not configured' };
  }

  // TODO: Implement subscription confirmation email
  console.log('Subscription email would be sent to:', email, 'Type:', subscriptionType);
  return { success: true };
}
