import { GoogleGenAI, Type } from "@google/genai";
import { TriageResult, TriagePriority, PatientRecord, PrescriptionSuggestion, DietPlanSuggestion, IncidentAnalysis, IncidentSeverity, DoctorSpecialty, ComplaintCategory, ComplaintUrgency, UserRole, LabResult } from "../types";

// Fix: Initialize the GoogleGenAI client. The API key is sourced from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Provides a preliminary triage suggestion based on patient-described symptoms.
 * This is for informational purposes and not a medical diagnosis.
 */
export const getTriageSuggestion = async (symptoms: string): Promise<string> => {
    try {
        // Fix: Use ai.models.generateContent for text generation.
        const response = await ai.models.generateContent({
            // Fix: Use a recommended model for basic text tasks.
            model: 'gemini-2.5-flash',
            contents: `A patient describes their symptoms as: "${symptoms}". Based on these symptoms, provide a preliminary triage suggestion. Advise them on whether they should seek immediate medical attention (e.g., go to the ER), schedule a doctor's appointment, or manage at home. Frame the response carefully as a suggestion, not a diagnosis, and always recommend consulting a healthcare professional for an accurate diagnosis.`,
            config: {
                // Fix: Add a system instruction to define the AI's role.
                systemInstruction: "You are a helpful AI medical assistant providing preliminary guidance. You are not a doctor and cannot give medical diagnoses.",
                temperature: 0.5,
            }
        });
        // Fix: Correctly extract the text from the response.
        return response.text;
    } catch (error) {
        console.error("Error getting triage suggestion:", error);
        return "Sorry, I was unable to process your request at this time. Please consult a healthcare professional directly.";
    }
};

/**
 * Determines the triage priority for a patient in an ER setting based on their chief complaint and vitals.
 * Returns a structured TriageResult object.
 */
export const getER_TriagePriority = async (data: { complaint: string, vitals: Partial<PatientRecord['vitals']> }): Promise<TriageResult> => {
    const prompt = `Analyze the following patient's chief complaint and vitals to determine the appropriate ER triage priority:
    - Chief Complaint: "${data.complaint}"
    - Vitals:
      - Heart Rate: ${data.vitals.heartRate ?? 'N/A'} bpm
      - Blood Pressure: ${data.vitals.bloodPressure ?? 'N/A'}
      - Temperature: ${data.vitals.temperature ?? 'N/A'} °C
      - Oxygen Saturation: ${data.vitals.oxygenSaturation ?? 'N/A'} %
    `;
    try {
        // Fix: Use ai.models.generateContent with responseSchema for JSON output.
        const response = await ai.models.generateContent({
            // Fix: Use a recommended model for complex text tasks.
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                // Fix: Define the expected JSON output format.
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        priority: {
                            type: Type.STRING,
                            // Fix: Use an enum to constrain possible values.
                            enum: Object.values(TriagePriority),
                            description: "The triage priority level."
                        },

                        rationale: {
                            type: Type.STRING,
                            description: "A brief explanation for the chosen priority level, considering both complaint and vitals."
                        },
                    },
                    required: ["priority", "rationale"]
                },
                systemInstruction: "You are an expert ER triage nurse AI. Your task is to classify patient complaints into CRITICAL, URGENT, or NON_URGENT priority levels based on their complaint and vitals, and provide a concise rationale.",
            }
        });

        // Fix: Correctly extract and parse the JSON from the response text.
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as TriageResult;

        // Validate the priority field against the enum
        if (Object.values(TriagePriority).includes(parsedResult.priority)) {
            return parsedResult;
        } else {
             throw new Error(`Invalid priority value received from API: ${parsedResult.priority}`);
        }

    } catch (error) {
        console.error("Error getting ER triage priority:", error);
        return {
            priority: TriagePriority.NON_URGENT,
            rationale: "Could not determine priority due to an error. Manual assessment required."
        };
    }
};


/**
 * Generates a patient discharge summary based on clinical notes.
 */
export const generateDischargeSummary = async (patientRecord: PatientRecord): Promise<string> => {
    const prompt = `
        Generate a patient discharge summary based on the following clinical information.
        The summary should be clear, concise, and easy for the patient to understand.
        It must include:
        1.  A brief summary of the hospital stay.
        2.  The final diagnosis.
        3.  Discharge medications and instructions.
        4.  Follow-up appointment details.
        
        Patient Information:
        - Name: ${patientRecord.name}
        - Age: ${patientRecord.age}
        - Gender: ${patientRecord.gender}
        - Chief Complaint on Admission: ${patientRecord.chiefComplaint}
        
        Clinical Notes:
        ${patientRecord.notes}
    `;

    try {
        // Fix: Use ai.models.generateContent for the summarization task.
        const response = await ai.models.generateContent({
            // Fix: Use a recommended model for complex text tasks.
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a medical scribe AI, skilled at creating clear and accurate patient discharge summaries from clinical notes.",
                temperature: 0.7,
            }
        });
        // Fix: Correctly extract the text from the response.
        return response.text;
    } catch (error) {
        console.error("Error generating discharge summary:", error);
        return "Failed to generate discharge summary due to an API error.";
    }
};

/**
 * Generates a prescription suggestion based on a patient's record.
 */
export const generatePrescriptionSuggestion = async (patientRecord: PatientRecord): Promise<PrescriptionSuggestion> => {
    const prompt = `
        Based on the patient's record, suggest a potential e-prescription.
        Analyze the diagnosis and clinical notes to recommend appropriate medications.

        Patient Information:
        - Name: ${patientRecord.name}
        - Age: ${patientRecord.age}
        - Gender: ${patientRecord.gender}
        - Chief Complaint on Admission: ${patientRecord.chiefComplaint}
        
        Clinical Notes & Diagnosis:
        ${patientRecord.notes}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacologist AI assistant. Your role is to suggest potential prescriptions based on patient data for review by a qualified doctor. Your suggestions are not a substitute for professional medical advice.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prescriptions: {
                            type: Type.ARRAY,
                            description: "A list of suggested medications.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    drug: { type: Type.STRING, description: "Name of the medication." },
                                    dosage: { type: Type.STRING, description: "Dosage (e.g., '500mg')." },
                                    frequency: { type: Type.STRING, description: "How often to take it (e.g., 'Twice daily')." },
                                    notes: { type: Type.STRING, description: "Optional additional instructions (e.g., 'With food')." },
                                },
                                required: ["drug", "dosage", "frequency"],
                            }
                        },
                        rationale: {
                            type: Type.STRING,
                            description: "A brief rationale for the suggested prescription plan."
                        }
                    },
                    required: ["prescriptions", "rationale"]
                },
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PrescriptionSuggestion;
    } catch (error) {
        console.error("Error generating prescription suggestion:", error);
        return {
            prescriptions: [],
            rationale: "Failed to generate a prescription suggestion due to an API error. Please review patient data manually."
        };
    }
};

/**
 * Generates a diet plan suggestion based on a patient's record.
 */
export const generateDietPlan = async (patientRecord: PatientRecord): Promise<DietPlanSuggestion> => {
    const prompt = `
        Based on the patient's record, generate a suitable 3-day diet plan.
        The diet should be tailored to their medical needs, considering their age, gender, and clinical diagnosis.
        For each day, provide suggestions for breakfast, lunch, and dinner. Also include any general dietary notes.
        Provide a rationale for your dietary choices based on the patient's condition.

        Patient Information:
        - Name: ${patientRecord.name}
        - Age: ${patientRecord.age}
        - Gender: ${patientRecord.gender}
        - Chief Complaint on Admission: ${patientRecord.chiefComplaint}
        
        Clinical Notes & Diagnosis:
        ${patientRecord.notes}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical nutritionist AI assistant. Your role is to suggest potential diet plans based on patient data for review by a qualified doctor. Your suggestions are not a substitute for professional medical advice.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rationale: {
                            type: Type.STRING,
                            description: "A brief rationale for the suggested diet plan, linking it to the patient's condition."
                        },
                        plan: {
                            type: Type.ARRAY,
                            description: "A list of daily meal plans for 3 days.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING, description: "The day of the plan (e.g., 'Day 1')." },
                                    breakfast: { type: Type.STRING, description: "Breakfast meal suggestion." },
                                    lunch: { type: Type.STRING, description: "Lunch meal suggestion." },
                                    dinner: { type: Type.STRING, description: "Dinner meal suggestion." },
                                    notes: { type: Type.STRING, description: "Optional notes for the day (e.g., 'Ensure high fluid intake')." },
                                },
                                required: ["day", "breakfast", "lunch", "dinner"],
                            }
                        }
                    },
                    required: ["rationale", "plan"]
                },
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as DietPlanSuggestion;
    } catch (error) {
        console.error("Error generating diet plan:", error);
        return {
            rationale: "Failed to generate a diet plan due to an API error. Please review patient data manually.",
            plan: []
        };
    }
};

/**
 * Provides a conversational response for the NCD Prevention chatbot.
 */
export const getNcdChatbotResponse = async (query: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: query,
            config: {
                systemInstruction: "You are an AI-driven conversational platform for Non-Communicable Diseases (NCD) prevention, risk assessment, and education. You deliver real-time risk assessments, tailored lifestyle recommendations, and screening reminders based on user queries, biometrics, and health history. Your output should be personalized advice, reminders, and risk reports. Your advice is for educational purposes and is not a substitute for professional medical advice. Always encourage users to consult with a healthcare provider for any health concerns.",
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting NCD chatbot response:", error);
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }
};

/**
 * Analyzes a medication or materiovigilance incident report to determine severity, root cause, and a corrective plan.
 */
export const analyzeIncidentReport = async (description: string): Promise<IncidentAnalysis> => {
    const prompt = `
        Analyze the following healthcare incident report. Based on the description, provide a structured analysis including:
        1.  **Severity Assessment**: Classify the severity as 'Mild', 'Moderate', 'Severe', or 'Critical'.
        2.  **Root Cause Analysis**: Identify the most likely root cause of the incident.
        3.  **Corrective Plan**: Suggest a concise, actionable plan to prevent recurrence.

        Incident Description:
        "${description}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert pharmacovigilance and quality management AI. Your task is to analyze incident reports, assess their severity, perform a root cause analysis, and recommend a clear, actionable corrective plan. Your analysis must be objective and based solely on the provided information.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        severity: {
                            type: Type.STRING,
                            enum: Object.values(IncidentSeverity),
                            description: "The assessed severity of the incident."
                        },
                        rootCause: {
                            type: Type.STRING,
                            description: "A detailed analysis of the likely root cause."
                        },
                        correctivePlan: {
                            type: Type.STRING,
                            description: "A list of actionable steps to prevent this type of incident in the future, formatted with numbered points."
                        }
                    },
                    required: ["severity", "rootCause", "correctivePlan"]
                },
            }
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as IncidentAnalysis;
        
        if (Object.values(IncidentSeverity).includes(parsedResult.severity)) {
            return parsedResult;
        } else {
            throw new Error(`Invalid severity value received from API: ${parsedResult.severity}`);
        }

    } catch (error) {
        console.error("Error analyzing incident report:", error);
        return {
            severity: IncidentSeverity.Mild,
            rootCause: "Failed to perform AI analysis due to an error. Manual review is required.",
            correctivePlan: "1. Manually investigate the incident.\n2. Document findings in the system."
        };
    }
};

/**
 * Suggests a medical specialty based on a patient's chief complaint.
 */
export const getSpecialtySuggestion = async (chiefComplaint: string): Promise<DoctorSpecialty | null> => {
    const prompt = `Analyze the following patient's chief complaint and suggest the single most relevant medical specialty.
    Complaint: "${chiefComplaint}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: `You are a medical assistant AI. Your task is to classify a patient's complaint into one of the following specialties: ${Object.values(DoctorSpecialty).join(', ')}.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        specialty: {
                            type: Type.STRING,
                            enum: Object.values(DoctorSpecialty),
                            description: "The most relevant medical specialty."
                        }
                    },
                    required: ["specialty"]
                },
            }
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as { specialty: DoctorSpecialty };
        
        if (Object.values(DoctorSpecialty).includes(parsedResult.specialty)) {
            return parsedResult.specialty;
        } else {
            console.warn("API returned an invalid specialty:", parsedResult.specialty);
            return null;
        }

    } catch (error) {
        console.error("Error getting specialty suggestion:", error);
        return null;
    }
};


export interface ComplaintAnalysis {
    category: ComplaintCategory;
    urgency: ComplaintUrgency;
    summary: string;
    suggestedAssigneeRole: UserRole.Doctor | UserRole.Nurse | UserRole.Admin | UserRole.Engineering;
}

/**
 * Analyzes a patient complaint to categorize it, determine urgency, and suggest an assignee.
 */
export const analyzeComplaint = async (complaintText: string): Promise<ComplaintAnalysis> => {
    const prompt = `Analyze the following patient complaint.
    1. Categorize it into one of the following: ${Object.values(ComplaintCategory).join(', ')}.
    2. Determine its urgency: ${Object.values(ComplaintUrgency).join(', ')}.
    3. Provide a concise, one-sentence summary of the core issue.
    4. Suggest the most appropriate role to handle it: ${[UserRole.Doctor, UserRole.Nurse, UserRole.Admin, UserRole.Engineering].join(', ')}.
    
    Complaint: "${complaintText}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are an AI assistant for a hospital's complaint management system. Your task is to analyze patient complaints and provide structured data for ticketing.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: Object.values(ComplaintCategory) },
                        urgency: { type: Type.STRING, enum: Object.values(ComplaintUrgency) },
                        summary: { type: Type.STRING, description: "A one-sentence summary." },
                        suggestedAssigneeRole: { type: Type.STRING, enum: [UserRole.Doctor, UserRole.Nurse, UserRole.Admin, UserRole.Engineering] },
                    },
                    required: ["category", "urgency", "summary", "suggestedAssigneeRole"]
                },
            }
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as ComplaintAnalysis;

        if (Object.values(ComplaintCategory).includes(parsedResult.category) && Object.values(ComplaintUrgency).includes(parsedResult.urgency)) {
            return parsedResult;
        } else {
            throw new Error("Invalid value received from API.");
        }
    } catch (error) {
        console.error("Error analyzing complaint:", error);
        return {
            category: ComplaintCategory.OTHER,
            urgency: ComplaintUrgency.MEDIUM,
            summary: "AI analysis failed. Manual review required.",
            suggestedAssigneeRole: UserRole.Admin,
        };
    }
};

/**
 * Checks for potential interactions between a list of drugs.
 */
export const checkDrugInteractions = async (drugs: string[]): Promise<string> => {
    const prompt = `As a clinical pharmacist, analyze the potential drug-drug interactions for the following list of medications: ${drugs.join(', ')}.
    Provide a concise summary. Categorize each potential interaction by severity (e.g., Critical, Major, Moderate, Minor). For each identified interaction, briefly explain the mechanism and the potential clinical outcome. If there are no significant interactions, state that clearly.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacist AI expert in drug interactions. Provide clear, accurate, and concise analysis.",
                temperature: 0.3,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error checking drug interactions:", error);
        return "Failed to check for interactions due to an API error.";
    }
};

/**
 * Checks for potential food-drug incompatibilities.
 */
export const checkFoodDrugIncompatibility = async (drug: string): Promise<string> => {
    const prompt = `As a clinical pharmacist, list the significant food-drug incompatibilities for the medication: "${drug}".
    For each incompatibility (e.g., with grapefruit juice, dairy products, high-fat meals, alcohol), provide a brief explanation of why the interaction occurs and what the potential effect is on the drug's absorption, metabolism, or efficacy. If there are no well-known significant interactions, state that.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacist AI expert in food-drug interactions. Provide clear and practical advice for patient counseling.",
                temperature: 0.3,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error checking food-drug incompatibility:", error);
        return "Failed to check for incompatibilities due to an API error.";
    }
};


/**
 * Retrieves detailed information about a specific drug.
 */
export const getDrugInformation = async (drug: string): Promise<string> => {
    const prompt = `Provide a concise but comprehensive drug information monograph for "${drug}".
    Include the following sections in your response, using markdown for formatting:
    - **Drug Class:**
    - **Mechanism of Action:**
    - **Common Side Effects:**
    - **Serious Adverse Reactions:**
    - **Contraindications & Cautions:**`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacist AI providing accurate drug information.",
                temperature: 0.2,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting drug information:", error);
        return "Failed to retrieve drug information due to an API error.";
    }
};

/**
 * Provides a quick analysis of a reported Adverse Drug Reaction.
 */
export const getADRAnalysis = async (reactionDescription: string): Promise<string> => {
    const prompt = `A patient has experienced the following adverse drug reaction: "${reactionDescription}".
    Based on this description, provide a brief preliminary analysis for the reporting pharmacist. Include:
    1.  A possible classification of the reaction (e.g., allergic, dose-related, idiosyncratic).
    2.  Immediate next steps or recommendations (e.g., monitor vitals, consult physician, document in patient chart).`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacovigilance AI. Provide quick, actionable insights on reported ADRs.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing ADR:", error);
        return "Could not perform preliminary analysis at this time.";
    }
};

/**
 * Provides a patient-friendly interpretation of lab results.
 */
export const interpretLabResult = async (testName: string, results: LabResult[]): Promise<string> => {
    const resultsString = results.map(r => `- ${r.parameter}: ${r.value} (Normal: ${r.referenceRange})${r.isAbnormal ? ' - Abnormal' : ''}`).join('\n');
    
    const prompt = `A patient has received the following lab results for a "${testName}" test.
    Please provide a simple, easy-to-understand interpretation of these results.
    Do not provide a diagnosis.
    Explain what each parameter generally measures.
    For any abnormal results, briefly explain what a high or low value might indicate in simple terms.
    Always end with a strong recommendation to discuss the results with their doctor for a proper diagnosis and next steps.

    Results:
    ${resultsString}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful medical AI assistant. Your role is to explain complex lab results to patients in a clear, simple, and reassuring way without giving a diagnosis.",
                temperature: 0.5,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error interpreting lab results:", error);
        return "Could not generate an AI interpretation at this time. Please discuss these results with your doctor.";
    }
};
