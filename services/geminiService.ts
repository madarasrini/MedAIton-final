
import { GoogleGenAI, Type } from "@google/genai";
import { TriageResult, TriagePriority, PatientRecord, PrescriptionSuggestion, DietPlanSuggestion, IncidentAnalysis, IncidentSeverity, DoctorSpecialty, ComplaintCategory, ComplaintUrgency, UserRole, LabResult } from "../types.ts";

// Fix: Initialize the GoogleGenAI client according to strict formatting guidelines.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

/**
 * Provides a preliminary triage suggestion based on patient-described symptoms.
 * This is for informational purposes and not a medical diagnosis.
 */
export const getTriageSuggestion = async (symptoms: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `A patient describes their symptoms as: "${symptoms}". Based on these symptoms, provide a preliminary triage suggestion. Advise them on whether they should seek immediate medical attention (e.g., go to the ER), schedule a doctor's appointment, or manage at home. Frame the response carefully as a suggestion, not a diagnosis, and always recommend consulting a healthcare professional for an accurate diagnosis.`,
            config: {
                systemInstruction: "You are a helpful AI medical assistant providing preliminary guidance. You are not a doctor and cannot give medical diagnoses.",
                temperature: 0.5,
            }
        });
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
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        priority: {
                            type: Type.STRING,
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
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as TriageResult;
        if (Object.values(TriagePriority).includes(parsedResult.priority)) return parsedResult;
        throw new Error(`Invalid priority value received from API: ${parsedResult.priority}`);
    } catch (error) {
        console.error("Error getting ER triage priority:", error);
        return { priority: TriagePriority.NON_URGENT, rationale: "Could not determine priority due to an error. Manual assessment required." };
    }
};

/**
 * Generates a patient discharge summary based on clinical notes.
 */
export const generateDischargeSummary = async (patientRecord: PatientRecord): Promise<string> => {
    const prompt = `Generate a patient discharge summary based on the following clinical information:
        Patient Information:
        - Name: ${patientRecord.name}
        - Age: ${patientRecord.age}
        - Gender: ${patientRecord.gender}
        - Chief Complaint on Admission: ${patientRecord.chiefComplaint}
        Clinical Notes:
        ${patientRecord.notes}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are a medical scribe AI, skilled at creating clear and accurate patient discharge summaries from clinical notes.",
                temperature: 0.7,
            }
        });
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
    const prompt = `Based on the patient's record, suggest a potential e-prescription.
        Patient Information:
        - Name: ${patientRecord.name}
        - Clinical Notes & Diagnosis: ${patientRecord.notes}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical pharmacologist AI assistant.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prescriptions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    drug: { type: Type.STRING },
                                    dosage: { type: Type.STRING },
                                    frequency: { type: Type.STRING },
                                    notes: { type: Type.STRING },
                                },
                                required: ["drug", "dosage", "frequency"],
                            }
                        },
                        rationale: { type: Type.STRING }
                    },
                    required: ["prescriptions", "rationale"]
                },
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating prescription suggestion:", error);
        return { prescriptions: [], rationale: "Failed to generate a prescription suggestion." };
    }
};

/**
 * Generates a diet plan suggestion based on a patient's record.
 */
export const generateDietPlan = async (patientRecord: PatientRecord): Promise<DietPlanSuggestion> => {
    const prompt = `Based on the patient's record, generate a suitable 3-day diet plan.
        Patient: ${patientRecord.name}, Diagnosis: ${patientRecord.notes}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are a clinical nutritionist AI assistant.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rationale: { type: Type.STRING },
                        plan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING },
                                    breakfast: { type: Type.STRING },
                                    lunch: { type: Type.STRING },
                                    dinner: { type: Type.STRING },
                                    notes: { type: Type.STRING },
                                },
                                required: ["day", "breakfast", "lunch", "dinner"],
                            }
                        }
                    },
                    required: ["rationale", "plan"]
                },
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating diet plan:", error);
        return { rationale: "Failed to generate a diet plan.", plan: [] };
    }
};

/**
 * Provides a conversational response for the NCD Prevention chatbot.
 */
export const getNcdChatbotResponse = async (query: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: query,
            config: {
                systemInstruction: "You are an AI-driven conversational platform for Non-Communicable Diseases (NCD) prevention.",
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting NCD chatbot response:", error);
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now.";
    }
};

/**
 * Analyzes a medication or materiovigilance incident report.
 */
export const analyzeIncidentReport = async (description: string): Promise<IncidentAnalysis> => {
    const prompt = `Analyze the following healthcare incident report: "${description}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert pharmacovigilance and quality management AI.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        severity: { type: Type.STRING, enum: Object.values(IncidentSeverity) },
                        rootCause: { type: Type.STRING },
                        correctivePlan: { type: Type.STRING }
                    },
                    required: ["severity", "rootCause", "correctivePlan"]
                },
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error analyzing incident report:", error);
        return { severity: IncidentSeverity.Mild, rootCause: "Manual review required.", correctivePlan: "Investigate manually." };
    }
};

/**
 * Suggests a medical specialty based on a patient's chief complaint.
 */
export const getSpecialtySuggestion = async (chiefComplaint: string): Promise<DoctorSpecialty | null> => {
    const prompt = `Suggest the most relevant medical specialty for: "${chiefComplaint}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: `Classify the complaint into one of: ${Object.values(DoctorSpecialty).join(', ')}.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { specialty: { type: Type.STRING, enum: Object.values(DoctorSpecialty) } },
                    required: ["specialty"]
                },
            }
        });
        const parsed = JSON.parse(response.text.trim());
        return parsed.specialty as DoctorSpecialty;
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
 * Analyzes a patient complaint.
 */
export const analyzeComplaint = async (complaintText: string): Promise<ComplaintAnalysis> => {
    const prompt = `Analyze the complaint: "${complaintText}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: "Analyze patient complaints and provide structured data.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: Object.values(ComplaintCategory) },
                        urgency: { type: Type.STRING, enum: Object.values(ComplaintUrgency) },
                        summary: { type: Type.STRING },
                        suggestedAssigneeRole: { type: Type.STRING, enum: [UserRole.Doctor, UserRole.Nurse, UserRole.Admin, UserRole.Engineering] },
                    },
                    required: ["category", "urgency", "summary", "suggestedAssigneeRole"]
                },
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error analyzing complaint:", error);
        return { category: ComplaintCategory.OTHER, urgency: ComplaintUrgency.MEDIUM, summary: "Manual review required.", suggestedAssigneeRole: UserRole.Admin };
    }
};

export const checkDrugInteractions = async (drugs: string[]): Promise<string> => {
    const prompt = `Analyze interactions for: ${drugs.join(', ')}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { systemInstruction: "You are a clinical pharmacist AI expert in drug interactions.", temperature: 0.3 }
        });
        return response.text;
    } catch (error) { return "Failed to check interactions."; }
};

export const checkFoodDrugIncompatibility = async (drug: string): Promise<string> => {
    const prompt = `List food-drug incompatibilities for: "${drug}".`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { systemInstruction: "You are a clinical pharmacist AI expert in food-drug interactions.", temperature: 0.3 }
        });
        return response.text;
    } catch (error) { return "Failed to check incompatibilities."; }
};

export const getDrugInformation = async (drug: string): Promise<string> => {
    const prompt = `Provide drug info for: "${drug}".`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { systemInstruction: "You are a clinical pharmacist AI.", temperature: 0.2 }
        });
        return response.text;
    } catch (error) { return "Failed to retrieve drug information."; }
};

export const getADRAnalysis = async (reactionDescription: string): Promise<string> => {
    const prompt = `Analyze ADR: "${reactionDescription}".`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { systemInstruction: "You are a clinical pharmacovigilance AI." }
        });
        return response.text;
    } catch (error) { return "Could not perform analysis."; }
};

export const interpretLabResult = async (testName: string, results: LabResult[]): Promise<string> => {
    const resultsString = results.map(r => `- ${r.parameter}: ${r.value} (Normal: ${r.referenceRange})${r.isAbnormal ? ' - Abnormal' : ''}`).join('\n');
    const prompt = `Interpret these lab results for "${testName}":\n${resultsString}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { systemInstruction: "Explain complex lab results simply without giving a diagnosis.", temperature: 0.5 }
        });
        return response.text;
    } catch (error) { return "Could not generate AI interpretation."; }
};
