import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.ASSISTANT_ID;

// Numărul maxim de încercări de a rula asistentul dacă nu returnează un mesaj imediat
const MAX_RETRIES = 2; // Încercăm de maxim 2 ori suplimentar

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message, threadId: existingThreadId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let threadId = existingThreadId;

        // Creează thread nou dacă nu există
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
        const userMessage = await openai.beta.threads.messages.create(
            threadId,
            {
                role: "user",
                content: message,
            }
        );
        console.log("User message added with ID:", userMessage.id);

        let assistantMessage = null;
        let retries = 0;

        // Mecanism de Retry pentru a obține răspuns de la asistent
        while (assistantMessage === null && retries <= MAX_RETRIES) {
            retries++;
            console.log(`Attempt ${retries}/${MAX_RETRIES + 1}: Running assistant ${assistantId} on thread ${threadId}...`);

            // Creează și Rulează asistentul pe thread
            let run = await openai.beta.threads.runs.create(
                threadId,
                {
                    assistant_id: assistantId,
                    // Nu adăugați instrucțiuni suplimentare aici decât dacă este absolut necesar
                    // Ele pot suprascrie instrucțiunile principale ale asistentului
                }
            );
            console.log("Run created with ID:", run.id);

            // Așteaptă până când rularea este finalizată
            console.log("Polling run status...");
            while (run.status !== 'completed' && run.status !== 'failed' && run.status !== 'cancelled' && run.status !== 'expired') {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Așteaptă 1 secunda înainte de a verifica din nou
                run = await openai.beta.threads.runs.retrieve( threadId, run.id );
                console.log("Run status:", run.status);
            }

            if (run.status !== 'completed') {
                 console.error(`Run failed with status: ${run.status}`);
                 // Dacă run-ul dă eroare, ieșim din bucla de retry
                 throw new Error(`OpenAI run failed or was cancelled. Status: ${run.status}`);
            }

            console.log("Run completed. Retrieving messages...");

            // Preia mesajele din thread, filtrate după ultimul mesaj al utilizatorului
            // Această abordare este mai robustă dacă mesajul asistentului nu se leagă strict de run_id
            const messages = await openai.beta.threads.messages.list(
                threadId,
                { order: 'desc', limit: 10 } // Preia ultimele 10 mesaje
            );

            // Găsește cel mai recent mesaj al asistentului care a apărut după mesajul utilizatorului
            assistantMessage = messages.data.find(
                 msg => msg.role === 'assistant' && new Date(msg.created_at * 1000) > new Date(userMessage.created_at * 1000)
            );

            if (assistantMessage) {
                console.log(`Assistant message found after ${retries} attempt(s).`);
                break; // Ieșim din bucla de retry dacă am găsit mesajul
            } else {
                 console.warn(`Attempt ${retries} failed to find a new assistant message for this run.`);
                 if (retries <= MAX_RETRIES) {
                     console.log("Retrying...");
                     await new Promise(resolve => setTimeout(resolve, 2000)); // Așteaptă puțin mai mult înainte de retry
                 }
            }
        }

        // Verifică din nou dacă s-a găsit un mesaj după toate încercările
        if (!assistantMessage) {
             console.error(`Failed to get assistant message after ${MAX_RETRIES + 1} attempts.`);
             // Acesta este cazul în care arătăm mesajul de eroare prietenos pe frontend
             return res.status(200).json({
                threadId: threadId,
                assistantMessage: { content: [{ type: 'text', text: { value: 'Îmi pare rău, asistentul nu a putut genera un răspuns acum. Te rog să încerci din nou sau să reformulezi.' } }] },
                // Optional: Poți semnala frontend-ului să pornească un thread nou la următorul mesaj dacă vrei
                // resetThread: true
             });
        }

        // Trimite răspunsul înapoi către frontend
        res.status(200).json({
            threadId: threadId,
            assistantMessage: assistantMessage,
        });

    } catch (error) {
        console.error('Error interacting with OpenAI API:', error);
        // Trimite eroarea înapoi către frontend
        res.status(500).json({
            error: `A apărut o eroare la comunicarea cu AI: ${error.message || 'Eroare necunoscută'}.`,
            threadId: req.body.threadId
        });
    }
}
