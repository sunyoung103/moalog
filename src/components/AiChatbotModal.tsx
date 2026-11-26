import React, { useState, useEffect, useRef } from 'react';
import { Specimen, SpeciesEcologyDetail, UserStats, UserAccount } from '../types';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { getUnder14DesignFlags } from '../utils/levelPolicy';
import { X, Send, Bot, Sparkles, HelpCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AiChatbotModalProps {
  specimen: Specimen;
  ecoDetail?: SpeciesEcologyDetail | null;
  userStats?: UserStats;
  userAccount?: UserAccount;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
  retryQuery?: string;
}

const DAILY_CHAT_STORAGE_KEY = 'moalog_ai_chat_daily_quota';

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readDailyUsedCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_CHAT_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed?.date === getTodayDateKey() && typeof parsed.count === 'number') {
      return Math.max(0, parsed.count);
    }
  } catch {}
  return 0;
}

function writeDailyUsedCount(count: number): void {
  try {
    localStorage.setItem(
      DAILY_CHAT_STORAGE_KEY,
      JSON.stringify({ date: getTodayDateKey(), count: Math.max(0, count) })
    );
  } catch {}
}

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({
  specimen,
  ecoDetail: propEcoDetail,
  userStats,
  userAccount,
  onClose,
}) => {
  const { under14 } = getUnder14DesignFlags(userAccount);
  const dailyLimit = userStats?.isProUser ? 30 : 5;
  const [dailyUsed, setDailyUsed] = useState<number>(() => readDailyUsedCount());
  const remainingCount = Math.max(0, dailyLimit - dailyUsed);

  const staticEcoDetail = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
    (e) => e.koreanName === specimen.koreanName
  );
  const ecoDetail = propEcoDetail || staticEcoDetail;

  const initialGreeting = `${specimen.koreanName}, 무엇이 궁금한가요?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: initialGreeting,
      timestamp: '지금',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [failedQuery, setFailedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, failedQuery]);

  const questionChips = [
    `${specimen.category === 'birds' ? '이 새' : specimen.category === 'plants' ? '이 식물' : specimen.category === 'fungi' ? '이 버섯' : '이 생물'} 특징 알려줘`,
    '관찰 및 촬영 팁은?',
    '탐사 에티켓 & 안전 주의점은?',
    '먹이나 영양 습성은?',
    '주요 서식처 환경은?',
    '비슷한 종과 구분법은?',
  ];

  // §0-3: Never send photos, GPS/location, nickname, or under-14 requests to Gemini.
  const requestSpeciesChat = async (query: string) => {
    setIsTyping(true);
    setFailedQuery(null);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError && m.id !== 'msg-welcome')
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const res = await fetch('/api/species-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isUnder14: under14,
          koreanName: specimen.koreanName,
          scientificName: specimen.scientificName,
          englishName: specimen.englishName || ecoDetail?.englishName || '',
          category: specimen.category,
          family: specimen.family || ecoDetail?.family || '',
          habitatType: specimen.habitatType || '',
          habitat: ecoDetail?.habitat || '',
          seasonality: ecoDetail?.seasonality || '',
          keyIdentification: ecoDetail?.keyIdentification || '',
          tags: ecoDetail?.tags || specimen.traitChips || [],
          status: ecoDetail?.status || '',
          question: query,
          history: historyPayload,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || typeof data?.answer !== 'string' || !data.answer.trim()) {
        throw new Error(data?.error || '응답 실패');
      }

      const nextUsed = dailyUsed + 1;
      setDailyUsed(nextUsed);
      writeDailyUsedCount(nextUsed);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer.trim(),
        timestamp: '방금',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // C-19d: Failed API responses do NOT decrement daily quota; show retry option.
      setFailedQuery(query);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    if (under14 || isTyping || remainingCount <= 0) return;
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: '지금',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    void requestSpeciesChat(query);
  };

  const handleRetry = () => {
    if (!failedQuery || isTyping || remainingCount <= 0) return;
    void requestSpeciesChat(failedQuery);
  };

  return (
    <div
      id="ai-chatbot-backdrop"
      className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full h-[82vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-xs shrink-0">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {specimen.koreanName}
                </h3>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/70 px-1.5 py-0.5 rounded-md shrink-0">
                  AI가 생성한 내용
                </span>
              </div>
              <p className="text-[10px] text-stone-500 truncate">
                참고용 AI 생태 해설 · 오늘 남은 질문{' '}
                <span className="font-bold text-stone-700 tabular-nums">
                  {remainingCount} / {dailyLimit}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {under14 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-[15px] font-bold text-stone-900">만 14세 미만 계정 안내</h4>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
              만 14세 미만 회원은 개인정보 보호 정책에 따라 AI 척척박사 대화 기능을 이용할 수 없어요.
              도감의 공식 생태 출처 정보를 확인해 보세요.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* Chat Message Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      isAi ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {isAi && (
                      <div className="w-7 h-7 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isAi
                          ? 'bg-white text-stone-800 shadow-xs whitespace-pre-line'
                          : 'bg-stone-900 text-white font-medium shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
                  <div className="w-6 h-6 rounded-lg bg-stone-200 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-stone-600 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-medium animate-pulse">
                    {specimen.koreanName} 생태 정보 정리 중...
                  </span>
                </div>
              )}

              {/* C-19d: API 실패 시 재시도 UI (횟수 차감 안 됨) */}
              {failedQuery && !isTyping && (
                <div className="flex items-start gap-2 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-[#fff3ee] text-[#ff5100] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl p-3 bg-white border border-[#ff5100]/25 shadow-xs space-y-2">
                    <p className="text-xs font-semibold text-stone-800">
                      일시적으로 답변을 불러오지 못했어요.
                    </p>
                    <p className="text-[11px] text-stone-500">
                      오늘 질문 횟수는 차감되지 않았어요. 다시 시도해 주세요.
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      다시 시도하기
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Recommended Chips Toolbar */}
            <div className="px-3.5 pt-2 pb-1.5 bg-white/70 shrink-0">
              <p className="text-[10px] font-bold text-stone-400 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-stone-400" />
                추천 질문
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {questionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isTyping || remainingCount <= 0}
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors active:scale-95 shrink-0 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Chat Input Bar */}
            <div className="p-3 bg-white shrink-0">
              {remainingCount <= 0 ? (
                <div className="text-center py-2 text-xs text-stone-500 font-medium">
                  오늘 질문 횟수({dailyLimit}회)를 모두 사용했어요. 내일 다시 이용할 수 있어요.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isTyping}
                    placeholder="생물에 대해 궁금한 점을 물어보세요"
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs font-medium disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    aria-label="보내기"
                    className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md disabled:opacity-30 transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
