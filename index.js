require('dotenv').config()
const express = require('express');
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const port = 3000
const methodOverride = require('method-override');


app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine','ejs')
app.set('views',path.join(__dirname,"views"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));


app.get('/',(req,res)=>{
    res.render('index.ejs')
})

app.get('/about',(req,res)=>{
    res.render('./about.ejs')
})

app.get(
    '/ai', (req, res)=>{

   res.render('./respons.ejs')
    }
)
app.post('/ai', async (req, res) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    const medicineName = req.body.medicine// Get the medicine name from the query parameter
    const languages = req.body.languages
    console.log(medicineName,languages);
    // Get the medicine name from the query parameter

    if (!medicineName) {
        return res.render('./respons.ejs', { response: null, error: "Please enter a medicine name to search." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a dynamic prompt based on the user's input
    const prompt = `
    You are an AI model designed to provide detailed information about medicines. The user will ask for information about a particular medicine. Based on the name or description , generate a detailed response covering the following points:
    1. Medicine name
    2. Uses/benefits
    3. Recommended time to take
    4. Common side effects
    5. Image URL of the medicine
    6. Additional relevant information (such as dosage, precautions)
    7. warning about medicine
    8. Provide a brief summary of the medicine 
    9. provide a list of similar medicines
    10.provide price range of this madicine
    11. provide a warnig "Do not take any medication without a prescription or professional guidance. Your health and safety are our top priority" . in "${languages}"

    Provide only valid JSON data without any extra text.
    The response should be in the following JSON format:
    {
        "medicineName": "Medicine Name",
        "uses": "Uses/Benefits",
        "recommendedTime": "Recommended Time to Take",
        "sideEffects": "Common Side Effects",
        "imageUrl": "Image URL of the Medicine",
        "additionalInfo": "Additional Relevant Information"
        "medWarning": "warning about medicine"
        "warning": "Please Consult a Doctor Before Taking Any Medicine."
        "summary": "summary of the medicine"
        "priceRange" : "price range of the medicine"
        "similarMedicines": "list of similar medicines"
        

    }
    
    Medicine to review: "${medicineName}"
    answer should be in "${languages}"
    `;

    try {
        // Generate the response from the AI model
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean the response text to remove Markdown syntax
        const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

        // Parse the cleaned response into a JSON object
        const response = JSON.parse(cleanedResponse);

        // Render the result in the template
        res.render('./ai.ejs', { response, error: null });
        // res.json(response)
        // console.log(response);
        
    } catch (error) {
        console.error("Error generating AI response:", error);
        res.render('./respons.ejs', { response: null, error: "An error occurred while fetching medicine information." });
    }
});

// app.post(
//     '/ai', (req, res)=>{

//         console.log(req.body); // Log the entire body to see what data is sent
//         const nameM = req.body;
//         console.log(nameM.name); // This should not throw an error if req.body is populated

//         // const nameM = req.body;
//         // console.log(nameM.name)
//     }
// )


app.listen(port,(req, res)=>{
    console.log(`Server is running on port ${port}`);
})

