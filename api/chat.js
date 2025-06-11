import OpenAI from 'openai';

// Inițializează clientul OpenAI
// Citește cheia din variabilele de mediu ale Vercel
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Citește Assistant ID-ul din variabilele de mediu ale Vercel
const assistantId = process.env.ASSISTANT_ID;

// Funcția principală a endpoint-ului serverless
export default async function handler(req, res) {
    // Permite doar cereri de tip POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message, threadId: existingThreadId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let threadId = existingThreadId;

        // Dacă nu există un threadId, creează unul nou
        if (!threadId) {
            console.log("Creating new thread...");
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            console.log("New thread created with ID:", threadId);
        } else {
             console.log("Using existing thread with ID:", threadId);
        }

        // Adaugă mesajul utilizatorului în thread
        console.log(`Adding message to thread ${threadId}: "${message}"`);
        await openai.beta.threads.messages.create(
            threadId,
            {
                role: "user",
                content: message,
            }
        );
         console.log("Message added.");

        // Rulează asistentul pe thread
        console.log(`Running assistant ${assistantId} on thread ${threadId}...`);
        let run = await openai.beta.threads.runs.create(
            threadId,
            {
                assistant_id: assistantId,
                 // Adaugă instrucțiuni suplimentare dacă vrei, de exemplu:
                 // instructions: "Please address the user as Jane Doe. The user has a premium account."
            }
        );
        console.log("Run created with ID:", run.id);


        // Așteaptă până când rularea este finalizată
        console.log("Polling run status...");
        while (run.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 500)); // Așteaptă puțin înainte de a verifica din nou
            run = await openai.beta.threads.runs.retrieve(
                threadId,
                run.id
            );
             console.log("Run status:", run.status);
            if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
                 throw new Error(`Run failed, cancelled, or expired. Status: ${run.status}`);
            }
        }
        console.log("Run completed.");


        // Preia mesajele din thread
        console.log("Retrieving messages...");
        const messages = await openai.beta.threads.messages.list(
            threadId,
            { order: 'asc' } // Ordonează cronologic
        );
         console.log("Messages retrieved.");


        // Găsește ultimul mesaj al asistentului
        const lastAssistantMessage = messages.data
            .filter(msg => msg.run_id === run.id && msg.role === 'assistant')
            .pop(); // Ia ultimul mesaj al asistentului din acest run

        if (!lastAssistantMessage) {
            // Aceasta se poate întâmpla dacă asistentul nu a răspuns, de exemplu dacă a avut instrucțiuni să nu răspundă
             console.warn("Assistant did not return a message for this run.");
             return res.status(200).json({
                threadId: threadId,
                assistantMessage: { content: [{ type: 'text', text: { value: 'Îmi pare rău, nu pot răspunde la această întrebare în momentul de față.' } }] }
             });
        }
         console.log("Last assistant message found.");

        // Trimite răspunsul înapoi către frontend
        res.status(200).json({
            threadId: threadId, // Returnează threadId pentru a continua conversația
            assistantMessage: lastAssistantMessage, // Returnează obiectul mesajului
        });

    } catch (error) {
        console.error('Error interacting with OpenAI API:', error);
        // Trimite eroarea înapoi către frontend
        res.status(500).json({
            error: error.message || 'An error occurred while communicating with the AI.',
            threadId: req.body.threadId // Returnează threadId chiar și la eroare pentru a nu pierde contextul
        });
    }
}
