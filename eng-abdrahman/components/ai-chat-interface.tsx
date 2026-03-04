"use client";

import { useChat } from 'ai/react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { useRef, useEffect } from 'react';

export function AIChatInterface() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
    });

    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-[600px] border border-border rounded-xl bg-card shadow-sm overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-border bg-emerald-950/10 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <div>
                    <h3 className="font-bold text-base text-foreground">مستشار الجودة الذكي (Copilot)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">مدعوم بالذكاء الاصطناعي لتحليل البيانات الحية واتخاذ القرارات</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground my-8 flex flex-col items-center gap-2">
                        <Bot className="w-12 h-12 text-emerald-600/50" />
                        <p className="text-sm font-medium">كيف يمكنني مساعدتك في تحليل الجودة اليوم؟</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <span className="text-xs bg-muted px-3 py-1.5 rounded-full cursor-not-allowed">لماذا ارتفعت نسبة الرفض اليوم؟</span>
                            <span className="text-xs bg-muted px-3 py-1.5 rounded-full cursor-not-allowed">أعطني ملخص عن ماكينات الرياض</span>
                        </div>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`flex gap-3`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-emerald-600 text-white'}`}>
                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-muted/50 border border-border' : 'bg-transparent text-foreground'}`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/80 flex items-center justify-center shrink-0">
                            <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                        </div>
                        <p className="text-xs text-muted-foreground animate-pulse">يحلل ملايين السجلات لتجهيز الإجابة...</p>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background flex gap-2">
                <input
                    className="flex-1 bg-muted/30 border border-border focus:bg-background rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="إسأل الذكاء الاصطناعي عن أي مؤشر أو عطل..."
                    dir="rtl"
                />
                <button
                    disabled={isLoading || !input.trim()}
                    type="submit"
                    className="bg-emerald-600 text-white px-5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center shadow-sm"
                >
                    <Send className="w-4 h-4 rotate-180" />
                </button>
            </form>
        </div>
    );
}
