import React, { useState, useRef, useEffect, FC } from 'react';
import { User } from '../types';
import { getNcdChatbotResponse } from '../services/geminiService';
import { SparklesIcon, UserIcon, ShieldExclamationIcon } from './Icons';
import { translations } from './translations';
import PharmacovigilanceModule from './PharmacovigilanceModule';

interface EngineeringDashboardProps {
  user: User;
}

type ActiveTab = 'chatbot' | 'pharmacovigilance';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

const NcdChatbot: FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'bot', text: translations.en.chatbotWelcome },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const t = (key: string) => translations.en[key] || key;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (isLoading || !messageText) return;
        setIsLoading(true);
        
        setMessages(prev => [...prev, { sender: 'user', text: messageText }]);

        try {
            const botResponse = await getNcdChatbotResponse(messageText);
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: t('chatbotError') }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        
        setInput('');
        await sendMessage(trimmedInput);
    };
    
    const quickPrompts = [
        "Assess my risk for Type 2 Diabetes",
        "Give me lifestyle tips for a healthy heart",
        "What are early signs of hypertension?",
        "Create a weekly exercise plan for a beginner",
    ];
    
    const handleQuickPrompt = (prompt: string) => {
        if (!isLoading) {
            sendMessage(prompt);
        }
    };

    return (
        <div className="flex flex-col h-[75vh] border rounded-lg">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 rounded-t-lg">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && (
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-lg p-3 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                         <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-md p-3 rounded-xl bg-white shadow-sm">
                             <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
             <div className="p-4 bg-white border-t rounded-b-lg">
                 <div className="mb-3 flex flex-wrap gap-2">
                    {quickPrompts.map(prompt => (
                        <button key={prompt} onClick={() => handleQuickPrompt(prompt)} disabled={isLoading} className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50">
                            {prompt}
                        </button>
                    ))}
                 </div>
                <form onSubmit={handleFormSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chatbotPlaceholder')}
                        className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300" disabled={isLoading || !input.trim()}>
                        {t('chatbotSend')}
                    </button>
                </form>
             </div>
        </div>
    );
};

const EngineeringDashboard: React.FC<EngineeringDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('chatbot');
    const t = (key: string) => translations.en[key] || key;

    const renderContent = () => {
        switch (activeTab) {
            case 'chatbot':
                return <NcdChatbot />;
            case 'pharmacovigilance':
                return <PharmacovigilanceModule />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Engineering & Infrastructure</h2>
                <p className="text-lg text-gray-600">Welcome, {user.name}. Access specialized modules below.</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-2 sm:p-4">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('chatbot')}
                            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'chatbot'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <SparklesIcon className="h-5 w-5 mr-2" /> {t('ncdChatbotTitle')}
                        </button>
                         <button
                            onClick={() => setActiveTab('pharmacovigilance')}
                            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'pharmacovigilance'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <ShieldExclamationIcon className="h-5 w-5 mr-2" /> {t('pharmacovigilanceTitle')}
                        </button>
                    </nav>
                </div>

                <div className="pt-4 sm:pt-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default EngineeringDashboard;
