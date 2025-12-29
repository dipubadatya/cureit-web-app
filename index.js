require('dotenv').config();
const express = require('express');
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const port = 3000;
const methodOverride = require('method-override');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Routes
app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/about', (req, res) => {
    res.render('about.ejs');
});

app.get('/ai', (req, res) => {
    res.render('respons.ejs');
});

// THE MAIN LOGIC
app.post('/ai', async (req, res) => {
    const medicineName = req.body.medicine;
    const languages = req.body.languages;

    if (!medicineName) {
        return res.render('respons.ejs', { error: "Please enter a medicine name." });
    }

    // --- ENHANCED PROMPT ---
    const prompt = `
    ACT AS AN EXPERT PHARMACIST AND BIOLOGIST. 
    Explain the medicine "${medicineName}" to a patient in the language: "${languages}".
    
    CRITICAL INSTRUCTIONS:
    1. Language: The entire JSON content must be translated into "${languages}". 
       - If "${languages}" is "Hinglish", use a mix of Hindi and English.
    2. Tone: Professional, calm, easy to understand.
    3. Output: STRICT JSON only. No markdown.

    REQUIRED JSON STRUCTURE:
    {
        "medicineName": "Name in English + Name in ${languages}",
        "uses": "List of main uses",
        "mechanismOfAction": "Explain simply how this medicine works inside the human body (e.g., blocks pain signals, relaxes blood vessels).",
        "recommendedTime": "Best time to take (e.g., After food, At night)",
        "sideEffects": "Common side effects",
        "medWarning": "Specific warnings (e.g., Avoid Alcohol, Pregnancy unsafe)",
        "criticalWarning": "TRANSLATE THIS EXACTLY: 'CureIt is for information only to help you understand complex details. It does NOT guide you to take medication. Do NOT take this medicine without a doctor's prescription.'",
        "summary": "A 2-line simple summary.",
        "priceRange": "Estimated price range",
        "similarMedicines": "List of 2-3 alternatives"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // CLEANER: Removes markdown backticks if AI adds them
        const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
        
        const response = JSON.parse(cleanedResponse);

        // Safety Check: If AI returns an error field
        if(response.error) {
             return res.render('respons.ejs', { error: "Could not find that medicine. Please check the spelling." });
        }

        res.render('ai.ejs', { response, error: null });

    } catch (error) {
        console.error("AI Error:", error);
        res.render('respons.ejs', { error: "Our pharmacist is busy right now. Please try again." });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
