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
          email: process.env.MAILERSEND_FROM_EMAIL || 'contact@personalityaiarchitect.com',
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
          email: process.env.MAILERSEND_FROM_EMAIL || 'contact@personalityaiarchitect.com',
          name: 'Socrate AI'
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Bun venit în călătoria socratică! 🎉',
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
              .info-box {
                background-color: #ebf8ff;
                border-left: 4px solid #4299e1;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #718096;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SOCRATE AI</h1>
              </div>

              <div class="content">
                <h2 style="color: #2d3748; font-size: 20px;">Bine ai venit!</h2>

                <p>Salut,</p>

                <p>Mă bucur că ai ales să pornești în această călătorie de introspecție alături de Socrate AI.</p>

                <div class="info-box">
                  <p style="margin: 0;"><strong>Contul tău Gratuit este Activ:</strong></p>
                  <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                    <li>20 de mesaje de explorare</li>
                    <li>Acces complet timp de 72 de ore</li>
                  </ul>
                </div>

                <p>Socrate AI nu este un simplu chatbot. Este un partener de dialog care te va ajuta să-ți clarifici gândurile prin întrebări, nu prin răspunsuri de-a gata.</p>

                <p>Ești gata să începi?</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://socrate-ai-8teu.vercel.app" class="button">Începe Conversația</a>
                </div>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Socrate AI. Toate drepturile rezervate.</p>
                <p>Ai primit acest email pentru că ți-ai creat un cont pe Socrate AI.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Bun venit la Socrate AI!

Salut,

Mă bucur că ai ales să pornești în această călătorie de introspecție.

Contul tău Gratuit este Activ:
- 20 de mesaje de explorare
- Acces complet timp de 72 de ore

Începe conversația aici: https://socrate-ai-8teu.vercel.app

© ${new Date().getFullYear()} Socrate AI
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailersend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    const data = await response.json();
    console.log('Welcome email sent to:', email);
    return { success: true, data };

  } catch (error) {
    console.error('Mailersend API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(email, subscriptionType) {
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
          email: process.env.MAILERSEND_FROM_EMAIL || 'contact@personalityaiarchitect.com',
          name: 'Socrate AI'
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Abonament Confirmat! ✅',
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
              .success-box {
                background-color: #f0fff4;
                border-left: 4px solid #48bb78;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #718096;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SOCRATE AI</h1>
              </div>

              <div class="content">
                <h2 style="color: #2d3748; font-size: 20px;">Mulțumim!</h2>

                <p>Plata ta a fost confirmată cu succes.</p>

                <div class="success-box">
                  <p style="margin: 0;"><strong>Abonamentul tău este acum ACTIV</strong></p>
                  <p style="margin: 8px 0 0 0;">Ai acces la 300 de mesaje pe lună și conversații nelimitate în timp.</p>
                </div>

                <p>Investiția în propria claritate este una dintre cele mai valoroase pe care le poți face.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://socrate-ai-8teu.vercel.app" class="button">Continuă Conversația</a>
                </div>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Socrate AI. Toate drepturile rezervate.</p>
                <p>Poți gestiona abonamentul oricând din contul tău.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Abonament Confirmat!

Plata ta a fost confirmată cu succes.

Abonamentul tău este acum ACTIV:
- 300 de mesaje pe lună
- Conversații nelimitate în timp

Continuă conversația: https://socrate-ai-8teu.vercel.app

© ${new Date().getFullYear()} Socrate AI
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailersend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    const data = await response.json();
    console.log('Subscription email sent to:', email);
    return { success: true, data };

  } catch (error) {
    console.error('Mailersend API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password changed notification email
 */
export async function sendPasswordChangedEmail(email) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.warn('Mailersend API key not configured');
    return { success: false, error: 'Mailersend not configured' };
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILERSEND_FROM_EMAIL || 'contact@personalityaiarchitect.com',
          name: 'Socrate AI'
        },
        to: [
          {
            email: email
          }
        ],
        subject: '⚠️ Parola ta a fost schimbată - Socrate AI',
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
              .alert {
                background-color: #fff5f5;
                border-left: 4px solid #fc8181;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .alert-title {
                font-weight: 600;
                color: #c53030;
                font-size: 16px;
                margin-bottom: 8px;
              }
              .content {
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background-color: #c53030;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #9b2c2c;
              }
              .info-box {
                background-color: #ebf8ff;
                border-left: 4px solid #4299e1;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #718096;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SOCRATE AI</h1>
              </div>

              <div class="alert">
                <div class="alert-title">⚠️ Alertă de Securitate</div>
                <p style="margin: 0;">Parola contului tău a fost schimbată cu succes.</p>
              </div>

              <div class="content">
                <p>Bună,</p>

                <p>Îți confirmăm că parola pentru contul tău Socrate AI (${email}) a fost schimbată acum câteva momente.</p>

                <div class="info-box">
                  <p style="margin: 0;"><strong>Ai solicitat tu această schimbare?</strong></p>
                  <p style="margin: 8px 0 0 0;">Dacă DA, poți ignora acest email. Contul tău este în siguranță.</p>
                </div>

                <p><strong style="color: #c53030;">Dacă NU ai solicitat această schimbare:</strong></p>

                <p>Contul tău ar putea fi compromis. Te rugăm să iei următoarele măsuri <strong>IMEDIAT:</strong></p>

                <ol style="color: #2d3748; line-height: 1.8;">
                  <li>Resetează-ți parola din nou folosind butonul de mai jos</li>
                  <li>Verifică dacă email-ul tău nu a fost compromis</li>
                  <li>Activează autentificarea în doi pași (dacă e disponibilă)</li>
                  <li>Contactează-ne imediat la contact@personalityaiarchitect.com</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/auth.html" class="button">Resetează Parola Urgent</a>
                </div>

                <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                  <strong>Detalii tehnice:</strong><br>
                  Data schimbării: ${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })} (ora României)<br>
                  Email cont: ${email}
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Socrate AI. Toate drepturile rezervate.</p>
                <p>Acest email a fost trimis automat ca măsură de securitate.</p>
                <p style="margin-top: 16px; font-size: 12px;">
                  Dacă ai întrebări despre securitatea contului tău, contactează-ne la<br>
                  <a href="mailto:contact@personalityaiarchitect.com" style="color: #4299e1;">contact@personalityaiarchitect.com</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
⚠️ ALERTĂ DE SECURITATE - Socrate AI

Bună,

Parola pentru contul tău Socrate AI (${email}) a fost schimbată acum câteva momente.

AI SOLICITAT TU ACEASTĂ SCHIMBARE?
✓ Dacă DA, poți ignora acest email. Contul tău este în siguranță.

✗ Dacă NU ai solicitat această schimbare, contul tău ar putea fi compromis!

IA MĂSURI IMEDIAT:
1. Resetează-ți parola din nou: ${baseUrl}/auth.html
2. Verifică dacă email-ul tău nu a fost compromis
3. Activează autentificarea în doi pași (dacă e disponibilă)
4. Contactează-ne URGENT la contact@personalityaiarchitect.com

DETALII TEHNICE:
Data schimbării: ${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}
Email cont: ${email}

© ${new Date().getFullYear()} Socrate AI
contact@personalityaiarchitect.com
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailersend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    const data = await response.json();
    console.log('Password changed notification sent to:', email);
    return { success: true, data };

  } catch (error) {
    console.error('Mailersend API error:', error);
    return { success: false, error: error.message };
  }
}
