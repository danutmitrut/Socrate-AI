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

        // Run assistant
        let run = await openai.beta.threads.runs.create(currentThreadId, {
            assistant_id: assistantId,
        });

        // Wait for completion
        while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'cancelling') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
        }

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(currentThreadId, { order: 'desc', limit: 1 });
            const lastAssistantMessage = messages.data.find(msg => msg.role === 'assistant');

            if (lastAssistantMessage) {
                // Increment usage counter
                const updatedUser = await incrementMessageUsage(auth.userId);

                // Log usage for analytics
                await logUsage(auth.userId, currentThreadId);

                return res.status(200).json({
                    threadId: currentThreadId,
                    assistantMessage: lastAssistantMessage,
                    usage: {
                        messagesUsed: updatedUser.messages_used,
                        messagesLimit: updatedUser.messages_limit,
                        messagesRemaining: updatedUser.messages_limit - updatedUser.messages_used
                    }
                });
            } else {
                return res.status(500).json({ error: "Asistentul nu a returnat un mesaj." });
            }
        } else {
            return res.status(500).json({ error: `Rularea a eșuat cu statusul: ${run.status}` });
        }

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(500).json({
            error: error.message || 'A apărut o eroare neașteptată.',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
