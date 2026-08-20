import React, { useState, useEffect, useRef } from 'react';
import { Specimen, SpeciesEcologyDetail } from '../types';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { X, Send, Bot, Sparkles, User, MessageCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AiChatbotModalProps {
  specimen: Specimen;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({ specimen, onClose }) => {
  const ecoDetail = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
    (e) => e.koreanName === specimen.koreanName
  );

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Recommended question chips
  const questionChips = [
    '이 새 특징 알려줘',
    '먹이는?',
    '울음소리는?',
    '서식지는?',
    '계절별 변화는?',
    '비슷한 종과 구분법은?',
  ];

  // AI Response Generator based on specimen knowledge
  const generateAiAnswer = (query: string): string => {
    const q = query.trim().toLowerCase();
    const name = specimen.koreanName;
    const isBird = specimen.category === 'birds';
    const isPlant = specimen.category === 'plants';
    const isInsect = specimen.category === 'insects';
    const isMammal = specimen.category === 'mammals';

    if (q.includes('특징') || q.includes('알려줘') || q.includes('설명')) {
      if (ecoDetail?.keyIdentification) {
        return `도심과 자연에서 만날 수 있는 ${specimen.family} ${isBird ? '조류' : isPlant ? '식물' : isInsect ? '곤충' : '생물'}예요.\n\n${ecoDetail.keyIdentification}\n\n식별 포인트: ${ecoDetail.tags.join(', ')}`;
      }
      return `${name}은(는) ${specimen.family}에 속하는 ${isPlant ? '식물' : '생물'}입니다. ${specimen.wikiSummary}`;
    }

    if (q.includes('먹이') || q.includes('밥') || q.includes('사냥') || q.includes('식성')) {
      if (ecoDetail?.dietAndBehavior) {
        return `【${name}의 먹이와 섭식 습성】\n${ecoDetail.dietAndBehavior}`;
      }
      if (isBird) {
        return `${name}은(는) 계절에 따라 작은 곤충, 풀씨, 나무 열매, 곡물 등을 섭취하는 잡식성 조류입니다.`;
      }
      if (isPlant) {
        return `${name}은(는) 풍부한 일조량과 비옥한 토양의 수분 및 유기물을 흡수하여 광합성을 통해 영양분을 만듭니다.`;
      }
      return `주로 서식지 주변의 유기물, 식물의 잎이나 작은 곤충 등을 먹이로 합니다.`;
    }

    if (q.includes('울음') || q.includes('소리') || q.includes('노래')) {
      if (ecoDetail?.callOrSound) {
        return `【${name}의 소리/음향】\n${ecoDetail.callOrSound}`;
      }
      if (isBird) {
        return `"짹-짹-", "삑-삑-" 같은 맑고 경쾌한 금속성 울음소리로 영역을 알리거나 짝을 부릅니다.`;
      }
      if (isInsect) {
        return `날개나 다리를 마찰시켜 맑은 진동음을 내어 동료와 소통합니다.`;
      }
      return `${name}은(는) 특별한 울음소리보다는 고유한 생태적 신호로 서식지에서 살아갑니다.`;
    }

    if (q.includes('서식') || q.includes('어디') || q.includes('사는곳') || q.includes('장소')) {
      if (ecoDetail?.habitat) {
        return `【주요 서식지】\n${ecoDetail.habitat}\n\n관찰 팁: ${ecoDetail.bestObservationTip || '햇살이 잘 드는 곳에서 자주 발견됩니다.'}`;
      }
      return `${specimen.locationCoord?.name || specimen.habitatType || '도심 공원 및 야산'} 일대에서 주로 발견되며, 사람들의 활동 공간과도 가깝게 공존합니다.`;
    }

    if (q.includes('계절') || q.includes('언제') || q.includes('시기') || q.includes('겨울') || q.includes('여름')) {
      if (ecoDetail?.seasonality) {
        return `【활동 계절】\n${ecoDetail.seasonality}\n${specimen.seasonalTip ? `\n계절 팁: ${specimen.seasonalTip}` : ''}`;
      }
      return `사계절 내내 또는 온화한 봄부터 가을 사이에 가장 활발한 생태 활동을 관찰할 수 있습니다.`;
    }

    if (q.includes('구분') || q.includes('비슷') || q.includes('차이') || q.includes('동정')) {
      return `【비슷한 종과의 구분 팁】\n${specimen.koreanName}의 가장 큰 특징은 ${specimen.traitChips.slice(0, 3).join(', ')}입니다. 크기와 ${specimen.family} 고유의 형태적 특징을 확인하면 쉽게 동정할 수 있습니다.`;
    }

    // Default friendly answer
    return `【${name} 생태 정보】\n${specimen.wikiSummary}\n\n더 궁금한 점(먹이, 울음소리, 서식지 등)이 있으시면 언제든 질문해 주세요!`;
  };

  const handleSendMessage = (textToSend?: string) => {
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
    setIsTyping(true);

    setTimeout(() => {
      const answer = generateAiAnswer(query);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        timestamp: '방금',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
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
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-stone-900">
                  {specimen.koreanName}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full">
                  온라인
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-mono">
                생태학 실시간 AI 도우미
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                {specimen.koreanName} 생태 정보 분석 중...
              </span>
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
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors active:scale-95 shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Chat Input Bar */}
        <div className="p-3 bg-white shrink-0">
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
              placeholder="특징을 물어보세요"
              className="flex-1 px-3.5 py-2.5 bg-stone-50 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md disabled:opacity-30 transition-all active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 text-emerald-400" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
