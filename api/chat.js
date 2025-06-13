// Exemplu pseudocod pentru /api/chat.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID;

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { message, threadId, action } = req.body; // <-- Aici preiei noul 'action'

        let currentThreadId = threadId;

        try {
            // NOU: Logica pentru a prelua istoricul mesajelor
            if (action === 'get_messages' && currentThreadId) {
                const messages = await openai.beta.threads.messages.list(currentThreadId);
                // Filtrează și formatează mesajele pentru frontend
                const formattedMessages = messages.data.reverse().map(msg => {
                    const contentText = msg.content
                        .filter(c => c.type === 'text')
                        .map(c => c.text.value)
                        .join('\n'); // Folosim '\n' pentru a respecta textul brut

                    return {
                        id: msg.id,
                        role: msg.role,
                        content: contentText
                    };
                });
                return res.status(200).json({ messages: formattedMessages, threadId: currentThreadId });
            }

            // LOGICA EXISTENTĂ: Pentru a trimite un mesaj nou și a obține un răspuns
            if (!currentThreadId) {
                const thread = await openai.beta.threads.create();
                currentThreadId = thread.id;
            }

            await openai.beta.threads.messages.create(currentThreadId, {
                role: 'user',
                content: message,
            });

            let run = await openai.beta.threads.runs.create(currentThreadId, {
                assistant_id: assistantId,
            });

            // Așteaptă finalizarea rulării (run)
            while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'cancelling') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
            }

            if (run.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(currentThreadId, { order: 'desc', limit: 1 });
                const lastAssistantMessage = messages.data.find(msg => msg.role === 'assistant');

                if (lastAssistantMessage) {
                    return res.status(200).json({
                        threadId: currentThreadId,
                        assistantMessage: lastAssistantMessage,
                    });
                } else {
                    return res.status(500).json({ error: "Assistant did not return a message for this run." });
                }
            } else {
                return res.status(500).json({ error: `Run failed with status: ${run.status}` });
            }

        } catch (error) {
            console.error('API Error:', error);
            res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
