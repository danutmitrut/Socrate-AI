import OpenAI from 'openai';
import { authenticateRequest } from '../lib/auth.js';
import { checkUserLimit, incrementMessageUsage, logUsage } from '../lib/db.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.ASSISTANT_ID;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // Authenticate user
        const auth = await authenticateRequest(req);
        if (!auth.authenticated) {
            return res.status(401).json({
                error: 'Neautentificat. Te rugăm să te autentifici.',
                code: 'UNAUTHORIZED'
            });
        }

        const { message, threadId, action } = req.body;
        let currentThreadId = threadId;

        // Handle get_messages action (no usage increment)
        if (action === 'get_messages' && currentThreadId) {
            const messages = await openai.beta.threads.messages.list(currentThreadId);
            const formattedMessages = messages.data.reverse().map(msg => {
                const contentText = msg.content
                    .filter(c => c.type === 'text')
                    .map(c => c.text.value)
                    .join('\n');

                return {
                    id: msg.id,
                    role: msg.role,
                    content: contentText
                };
            });
            return res.status(200).json({ messages: formattedMessages, threadId: currentThreadId });
        }

        // Check user limits before processing message
        const limitCheck = await checkUserLimit(auth.userId);

        if (!limitCheck.allowed) {
            // Special handling for dormant accounts
            if (limitCheck.requiresUpgrade) {
                return res.status(403).json({
                    error: 'Ai folosit cele 20 mesaje gratuite. Upgrade pentru a continua!',
                    code: 'ACCOUNT_DORMANT',
                    upgradeRequired: true,
                    user: {
                        subscriptionType: limitCheck.user.subscription_type,
                        messagesUsed: limitCheck.user.messages_used,
                        messagesLimit: limitCheck.user.messages_limit
                    }
                });
            }

            // Other limit errors
            const errorMessages = {
                'Free tier expired (72h)': 'Perioada ta gratuită de 72 ore a expirat. Pentru a continua, achiziționează un abonament.',
                'Subscription expired': 'Abonamentul tău a expirat. Te rugăm să reînnoiești abonamentul.',
                'Free tier limit reached (20 messages)': 'Ai atins limita de 20 mesaje gratuite. Pentru a continua, achiziționează un abonament.',
                'Monthly limit reached (300 messages)': 'Ai atins limita lunară de 300 mesaje. Limita se va reseta la reînnoirea abonamentului.'
            };

            return res.status(403).json({
                error: errorMessages[limitCheck.reason] || limitCheck.reason,
                code: 'LIMIT_EXCEEDED',
                user: {
                    subscriptionType: limitCheck.user.subscription_type,
                    messagesUsed: limitCheck.user.messages_used,
                    messagesLimit: limitCheck.user.messages_limit
                }
            });
        }

        // Create thread if needed
        if (!currentThreadId) {
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
        }

        // Add user message to thread
        await openai.beta.threads.messages.create(currentThreadId, {
            role: 'user',
            content: message,
        });

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send initial data (threadId)
        res.write(`data: ${JSON.stringify({ type: 'init', threadId: currentThreadId })}\n\n`);

        // Stream the run
        const stream = openai.beta.threads.runs.stream(currentThreadId, {
            assistant_id: assistantId,
        });

        let fullResponse = "";

        for await (const event of stream) {
            if (event.event === 'thread.message.delta') {
                const chunk = event.data.delta.content?.[0];
                if (chunk && chunk.type === 'text' && chunk.text.value) {
                    const text = chunk.text.value;
                    fullResponse += text;
                    // Send delta to client
                    res.write(`data: ${JSON.stringify({ type: 'delta', content: text })}\n\n`);
                }
            } else if (event.event === 'thread.run.completed') {
                // Run completed successfully
                // Increment usage counter
                const updatedUser = await incrementMessageUsage(auth.userId);

                // Log usage for analytics
                await logUsage(auth.userId, currentThreadId);

                // Send usage update to client
                res.write(`data: ${JSON.stringify({
                    type: 'usage',
                    usage: {
                        messagesUsed: updatedUser.messages_used,
                        messagesLimit: updatedUser.messages_limit,
                        messagesRemaining: updatedUser.messages_limit - updatedUser.messages_used
                    }
                })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Chat API Error:', error);
        // If headers haven't been sent yet, send JSON error
        if (!res.headersSent) {
            return res.status(500).json({
                error: error.message || 'A apărut o eroare neașteptată.',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        } else {
            // If streaming started, send error event
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
            res.end();
        }
    }
}
