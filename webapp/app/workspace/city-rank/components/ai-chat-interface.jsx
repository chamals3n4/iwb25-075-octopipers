"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Search,
    ArrowRight,
    MessageCircle,
    X,
    Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/api"
import { useSession } from "next-auth/react"

export default function AIChatInterface() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatResponse, setChatResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [followUpQuery, setFollowUpQuery] = useState("");
    const { data: session } = useSession()

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsChatOpen(true);
        setIsLoading(true);
        setChatResponse("");

        try {
            const response = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(session)
                },
                body: JSON.stringify({
                    message: searchQuery.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.message || "Failed to get response");
            }

            const formattedResponse = formatPerplexityResponse(data, searchQuery);
            setChatResponse(formattedResponse);
        } catch (error) {
            console.error("Error fetching chat response:", error);
            setChatResponse(`Sorry, I encountered an error while processing your request: "${searchQuery}". Please try again later.

Error details: ${error.message}

In the meantime, here are some general travel tips:
• Check visa requirements for your destination
• Research local customs and etiquette
• Consider travel insurance
• Pack according to the climate and activities planned`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowUpSearch = async () => {
        if (!followUpQuery.trim()) return;

        setIsLoading(true);
        const currentFollowUp = followUpQuery.trim();
        setFollowUpQuery("");

        try {
            const response = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(session)
                },
                body: JSON.stringify({
                    message: currentFollowUp,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.message || "Failed to get response");
            }

            const formattedResponse = formatPerplexityResponse(data, currentFollowUp);
            setChatResponse(formattedResponse);
            setSearchQuery(currentFollowUp);
        } catch (error) {
            console.error("Error fetching follow-up response:", error);
            setChatResponse(`Sorry, I encountered an error while processing your follow-up question: "${currentFollowUp}". Please try again.

Error details: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPerplexityResponse = (data, query) => {
        let formattedText = "";

        if (data.answer) {
            formattedText = data.answer;
        } else if (data.content) {
            formattedText = data.content;
        } else if (data.response) {
            formattedText = data.response;
        } else {
            formattedText = JSON.stringify(data, null, 2);
        }

        return formattedText;
    };

    const renderFormattedText = (text) => {
        const lines = text.split("\n");

        return lines.map((line, index) => {
            if (line.trim() === "") {
                return <br key={index} />;
            }

            const processedLine = line.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );

            if (line.trim().startsWith("- **")) {
                return (
                    <div key={index} className="mb-4">
                        <div
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: processedLine }}
                        />
                    </div>
                );
            } else if (line.trim().startsWith("- ") || line.trim().startsWith("•")) {
                return (
                    <div key={index} className="mb-2 ml-4">
                        <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: processedLine }}
                        />
                    </div>
                );
            } else {
                return (
                    <div key={index} className="mb-2">
                        <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: processedLine }}
                        />
                    </div>
                );
            }
        });
    };

    const quickQuestions = [
        "What are the best cities to visit?",
        "Tell me about top attractions in popular cities",
        "Which city has the best food scene?",
        "What's the weather like in different cities?",
        "How safe are cities for tourists?",
    ];

    return (
        <>
            {/* Floating Chat Button */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
            >
                <Button
                    onClick={() => setIsChatOpen(true)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                    size="icon"
                    data-chat-button
                >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
            </motion.div>

            {/* Chat Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end p-2 sm:p-4 lg:p-6">
                    <div className="absolute inset-0 bg-black/20" onClick={() => setIsChatOpen(false)} />

                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="relative w-full max-w-md h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">City AI Assistant</h3>
                                    <p className="text-xs text-gray-500">Ask me anything about cities</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsChatOpen(false)}
                                className="w-8 h-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Chat Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {!chatResponse && !isLoading && (
                                <div className="space-y-4">
                                    <div className="text-center py-8">
                                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h4 className="font-medium text-gray-900 mb-2">How can I help you today?</h4>
                                        <p className="text-sm text-gray-500">Ask me about cities, attractions, travel tips, and more!</p>
                                    </div>

                                    {/* Quick Questions */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Quick Questions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {quickQuestions.map((question, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-gray-50 text-xs"
                                                    onClick={() => {
                                                        setSearchQuery(question);
                                                        handleSearch();
                                                    }}
                                                >
                                                    {question}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* User Query */}
                            {searchQuery && (
                                <div className="flex justify-end">
                                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl max-w-[80%]">
                                        <p className="text-sm">{searchQuery}</p>
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex space-x-1">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Thinking...</span>
                                    </div>
                                </div>
                            )}

                            {/* AI Response */}
                            {chatResponse && !isLoading && (
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4 max-w-[85%]">
                                            <div className="prose prose-sm max-w-none">
                                                <div className="text-sm text-gray-700">
                                                    {renderFormattedText(chatResponse)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Follow-up Input */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-gray-700">Ask a follow-up question</p>
                                            <div className="flex space-x-2">
                                                <Input
                                                    placeholder="Ask anything else..."
                                                    value={followUpQuery}
                                                    onChange={(e) => setFollowUpQuery(e.target.value)}
                                                    className="flex-1 text-sm"
                                                    onKeyPress={(e) => e.key === "Enter" && handleFollowUpSearch()}
                                                    disabled={isLoading}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={handleFollowUpSearch}
                                                    disabled={isLoading || !followUpQuery.trim()}
                                                    className="px-3"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {!chatResponse && !isLoading && (
                            <div className="p-4 border-t">
                                <div className="flex space-x-2">
                                    <Input
                                        placeholder="Ask about cities, attractions, travel tips..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1"
                                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        disabled={!searchQuery.trim()}
                                        className="px-4"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </>
    );
}