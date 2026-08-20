import React, { useState } from 'react';
import { Camera, Compass, Leaf, Feather, Bug, Check, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NaturalistPersona } from '../types';

interface OnboardingModalProps {
  onComplete: (selectedPersona: NaturalistPersona) => void;
  initialPersona?: NaturalistPersona;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  initialPersona = 'general',
}) => {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<NaturalistPersona>(initialPersona);

  const personaList: {
    id: NaturalistPersona;
    icon: any;
    title: string;
    desc: string;
    subLabel: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    tags: string[];
  }[] = [
    {
      id: 'general',
      icon: Compass,
      title: '만능 탐험가',
      desc: '식물, 조류, 곤충 등 다양한 생물군을 관찰해요.',
      subLabel: '전천후 도심 생태 관찰',
      color: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900',
      tags: ['식물', '조류', '곤충'],
    },
    {
      id: 'botanist',
      icon: Leaf,
      title: '식물 탐험가',
      desc: '야생화, 나무, 풀 등 다양한 식물류를 관찰해요.',
      subLabel: '야생화 & 식물 분류학',
      color: 'bg-emerald-500 text-white',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      tags: ['야생화', '나무', '풀'],
    },
    {
      id: 'birder',
      icon: Feather,
      title: '조류 탐험가',
      desc: '텃새, 철새, 물새 등 다양한 조류를 관찰해요.',
      subLabel: '필드 탐조 & 조류 생태',
      color: 'bg-sky-600 text-white',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-900',
      tags: ['텃새', '철새', '물새'],
    },
    {
      id: 'entomologist',
      icon: Bug,
      title: '곤충 탐험가',
      desc: '나비, 잠자리, 딱정벌레 등 다양한 곤충류를 관찰해요.',
      subLabel: '미소 생태 & 수분 매개 곤충',
      color: 'bg-amber-500 text-white',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      tags: ['나비', '잠자리', '딱정벌레'],
    },
  ];

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      onComplete(selectedPersona);
    }
  };

  const currentPersonaObj = personaList.find((p) => p.id === selectedPersona) || personaList[0];

  const getPersonaFullLabel = (id: NaturalistPersona) => {
    switch (id) {
      case 'botanist':
        return '식물 분류학 전문가 (Botanist)';
      case 'birder':
        return '필드 탐조 전문가 (Birder)';
      case 'entomologist':
        return '미소 생태 전문가 (Entomologist)';
      case 'general':
      default:
        return '전천후 생태 탐험가 (Generalist)';
    }
  };

  return (
    <div
      id="onboarding-fullscreen-window"
      className="fixed inset-0 z-50 bg-[#F2F5F0] text-stone-900 flex flex-col justify-between overflow-y-auto select-none p-5 sm:p-8"
    >
      {/* Top Header Bar with MOALOG Logo */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-3">
        {/* MOALOG Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#202424] text-emerald-400 flex items-center justify-center font-black text-base shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-[#202424] tracking-tight leading-none">
              MOALOG
            </span>
            <span className="text-[10px] text-stone-500 font-medium tracking-wide">
              자연 생태 도감
            </span>
          </div>
        </div>

        {/* Step Indicator dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === idx ? 'w-7 bg-[#202424]' : 'w-2 bg-stone-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md mx-auto my-auto py-4 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {/* STEP 0: Welcome & Animal Capture Visual */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Camera Animal Capture Image Card with Viewfinder overlay */}
              <div className="relative w-full max-w-xs aspect-4/3 rounded-3xl overflow-hidden shadow-md bg-stone-900 mb-6 border-2 border-white">
                <img
                  src="https://images.unsplash.com/photo-1549608276-5786777e6587?w=800&auto=format&fit=crop&q=80"
                  alt="자연 속 동물을 포착하는 카메라"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/30" />

                {/* Viewfinder Reticle Overlay */}
                <div className="absolute inset-4 border border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono font-bold">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      REC · AUTO FOCUS
                    </span>
                    <span className="bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-white">4K 60FPS</span>
                  </div>

                  {/* Center Target Box */}
                  <div className="self-center w-16 h-16 border-2 border-emerald-400/90 rounded-xl relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <Camera className="w-5 h-5 text-white drop-shadow-md" />
                  </div>

                  <div className="flex justify-between items-end text-[10px] text-white/90 font-mono">
                    <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      🎯 조류 / 직박구리 (98%)
                    </span>
                    <span className="bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                      찰칵!
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact Requested Headlines */}
              <h1 className="text-xl sm:text-2xl font-black text-[#202424] mb-2 tracking-tight leading-snug">
                자연스럽게 마주친 생물을 찰칵<br />
                포착해보세요.
              </h1>

              <p className="text-sm font-bold text-emerald-700 mb-6 tracking-tight">
                나만의 도감을 완성할 수 있어요!
              </p>

              {/* 3 Value Pillars */}
              <div className="w-full grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-white rounded-2xl text-center shadow-2xs border border-stone-200/60">
                  <span className="text-xl block mb-1">📸</span>
                  <span className="text-xs font-bold text-stone-800 block">카메라 포착</span>
                  <span className="text-[10px] text-stone-500">순간 AI 식별</span>
                </div>
                <div className="p-3 bg-white rounded-2xl text-center shadow-2xs border border-stone-200/60">
                  <span className="text-xl block mb-1">✨</span>
                  <span className="text-xs font-bold text-stone-800 block">누끼 스티커</span>
                  <span className="text-[10px] text-stone-500">나만의 카드화</span>
                </div>
                <div className="p-3 bg-white rounded-2xl text-center shadow-2xs border border-stone-200/60">
                  <span className="text-xl block mb-1">🗺️</span>
                  <span className="text-xs font-bold text-stone-800 block">도감 리포트</span>
                  <span className="text-[10px] text-stone-500">성향별 생태 분석</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Explorer Persona Selection */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Explorer Persona Tag Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black tracking-wide mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>&#123;탐험가 성향 분류&#125;</span>
              </div>

              {/* Exact Requested Question & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-black text-[#202424] mb-1.5 tracking-tight">
                어떤 탐험가이신가요?
              </h2>
              <p className="text-xs font-medium text-stone-600 mb-5">
                성향에 맞춰 맞춤 추천 서비스를 제공합니다.
              </p>

              {/* 4 Persona Cards */}
              <div className="w-full space-y-2.5 mb-2 text-left">
                {personaList.map((p) => {
                  const IconComp = p.icon;
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPersona(p.id)}
                      className={`w-full p-3.5 rounded-2xl transition-all flex items-center gap-3 border ${
                        isSelected
                          ? 'bg-[#202424] text-white border-[#202424] shadow-md scale-[1.01]'
                          : 'bg-white text-stone-800 border-stone-200/80 hover:bg-stone-50 shadow-2xs'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isSelected ? p.color : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        <IconComp className="w-5 h-5 stroke-[2.2px]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs sm:text-sm font-black truncate">
                            {p.title}
                          </h4>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {p.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs leading-relaxed ${
                            isSelected ? 'text-stone-300' : 'text-stone-600'
                          }`}
                        >
                          {p.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Confirmation Card (Exact requested structured layout) */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-sm border border-emerald-200/60">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>

              {/* 상단 타이틀 (메인 헤드카피) */}
              <h2 className="text-2xl sm:text-3xl font-black text-[#202424] mb-4 tracking-tight">
                탐험 준비 완료!
              </h2>

              {/* 프로필 요약 Card */}
              <div className="w-full bg-white rounded-2xl p-4 mb-3.5 border border-stone-200/80 shadow-2xs text-left">
                <div className="text-[11px] font-bold text-stone-500 mb-1">
                  선택한 관찰자 성향
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{getPersonaFullLabel(selectedPersona)}</span>
                </div>
              </div>

              {/* 안내 메시지 (본문) */}
              <div className="w-full bg-emerald-50/70 rounded-2xl p-4 mb-4 border border-emerald-100/90 text-left text-xs font-medium text-stone-700 leading-relaxed space-y-1">
                <p>초기 관찰자 프로필이 정상적으로 탑재되었습니다.</p>
                <p className="text-emerald-800 font-bold">
                  탐험 지도에서 성향 맞춤 생물 표본을 추천합니다.
                </p>
              </div>

              {/* 하단 툴팁 (팁/Notice) */}
              <div className="w-full bg-stone-100/80 rounded-xl p-3 text-left text-[11px] font-medium text-stone-600 border border-stone-200/50 flex items-start gap-1.5">
                <span className="shrink-0">💡</span>
                <span>
                  관찰자 성향은 언제든 <strong className="text-stone-900">[마이페이지 &gt; 프로필]</strong>에서 자유롭게 변경 가능합니다.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Button Area */}
      <div className="w-full max-w-md mx-auto pb-3 pt-2">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 bg-[#202424] hover:bg-stone-850 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>
            {step === 2
              ? '모아로그 탐험 시작하기'
              : step === 1
              ? '성향 선택 완료'
              : '다음'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

