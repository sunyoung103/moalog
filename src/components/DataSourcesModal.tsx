import React from 'react';
import { X, ShieldCheck, ExternalLink, Sparkles, BookOpen, Volume2, Globe, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ActiveSpecimenSourceItem {
  label: string;
  detail: string;
  href?: string;
}

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimenName?: string;
  activeSources?: ActiveSpecimenSourceItem[];
}

const DATA_SOURCE_GROUPS = [
  {
    id: 'taxonomy',
    groupTitle: '이름 · 분류',
    icon: BookOpen,
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    items: [
      {
        name: 'GBIF Backbone Taxonomy',
        detail: '학명 · 분류체계 · CC BY 4.0 · DOI 표기',
        href: 'https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c',
      },
      {
        name: '국가생물종목록 (국립생물자원관)',
        detail: '한국 국명 · 공공누리 제3유형 (변경 금지)',
        href: 'https://species.nibr.go.kr/index.do',
      },
    ],
  },
  {
    id: 'conservation',
    groupTitle: '분포 · 보전',
    icon: Globe,
    accent: 'text-sky-700 bg-sky-50 border-sky-200/70',
    items: [
      {
        name: '국립공원 생물자원 현황',
        detail: '공공누리 제1유형 (출처 표시)',
        href: 'https://www.knps.or.kr',
      },
      {
        name: 'iNaturalist · GBIF 관찰 기록',
        detail: '월별 출현 시즌 · 관찰 통계 집계 (CC BY 4.0)',
        href: 'https://www.inaturalist.org',
      },
      {
        name: '한국의 멸종위기종 (환경부 · 국립생물자원관)',
        detail: '국내 법정보호종 · 이용 제한 없음',
        href: 'https://www.nie.re.kr',
      },
      {
        name: '표준식물종정보 (국립수목원)',
        detail: '식물 자생지 정보 · 이용 제한 없음',
        href: 'https://www.nature.go.kr',
      },
    ],
  },
  {
    id: 'media',
    groupTitle: '소리 · 요약',
    icon: Volume2,
    accent: 'text-amber-700 bg-amber-50 border-amber-200/70',
    items: [
      {
        name: 'iNaturalist · Xeno-canto 녹음',
        detail: 'CC0 · CC BY 라이선스만 선별 사용 · 녹음마다 작가 표기 (미보유 시 Web Audio 합성)',
        href: 'https://xeno-canto.org',
      },
      {
        name: 'Wikipedia 요약',
        detail: 'CC BY-SA 4.0 · 상세 화면 내 원문 링크 제공',
        href: 'https://ko.wikipedia.org',
      },
    ],
  },
  {
    id: 'ai',
    groupTitle: 'AI',
    icon: Sparkles,
    accent: 'text-purple-700 bg-purple-50 border-purple-200/70',
    items: [
      {
        name: 'AI가 생성한 내용',
        detail: 'AI 한줄평 · 생태 해설 · AI 생태학자(척척박사) · 참고용 라벨 표시',
      },
    ],
  },
];

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  specimenName,
  activeSources,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[130] bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] text-stone-900 rounded-t-[28px] sm:rounded-3xl max-w-md w-full max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">데이터 출처 및 라이선스</h3>
                  <p className="text-[11px] text-stone-500">
                    {specimenName ? `${specimenName} 화면에 실제 반영된 출처` : '이용 조건 및 AI 안내'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body with generous bottom padding so footer text never clips */}
            <div className="flex-1 overflow-y-auto p-4 pb-10 space-y-3.5">
              {/* Active Sources for Current Specimen */}
              {activeSources && activeSources.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#c4eb43] p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#f4fbdd] text-[#6d8911] border border-[#c4eb43] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-xs font-black text-stone-900">
                      {specimenName ? `${specimenName} 실제 사용 출처` : '현재 항목 실제 사용 출처'}
                    </h4>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {activeSources.map((src, idx) => (
                      <div key={`${src.label}-${idx}`} className="py-2 first:pt-0.5 last:pb-0.5 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900">{src.label}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{src.detail}</p>
                        </div>
                        {src.href && (
                          <a
                            href={src.href}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
                            title="원문 보기"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Cross-Border API & License Assurance Banner */}
              <div className="bg-emerald-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#c4eb43] shrink-0" />
                  <h4 className="text-xs font-black tracking-wide text-[#c4eb43]">글로벌 상업 출시 및 국가별 오픈 라이선스 보증</h4>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed">
                  모아로그는 한국뿐만 아니라 <strong>미국, 일본, 중국, 유럽 등 글로벌 접속자</strong>를 위해 각 국가 및 대륙별 공식 오픈 생물다양성 API(GBIF 글로벌 노드, iNaturalist 월드와이드 관찰망, IUCN/CITES 생태 지표)를 통해 실시간으로 데이터를 연동합니다. 모든 데이터는 상업적 이용이 보장된 오픈 라이선스(CC BY 4.0 / CC0)를 준수합니다.
                </p>
                <div className="pt-1.5 border-t border-emerald-800/80 grid grid-cols-2 gap-2 text-[10px] text-emerald-200">
                  <div>• 글로벌 표준 GBIF / iNaturalist (CC BY 4.0)</div>
                  <div>• 접속 국가별 맞춤 생태 데이터 및 출처 자동 분기</div>
                </div>
              </div>

              {DATA_SOURCE_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg border flex items-center justify-center ${group.accent}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-stone-900">{group.groupTitle}</h4>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {group.items.map((item) => (
                        <div key={item.name} className="py-2 first:pt-0.5 last:pb-0.5 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800">{item.name}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{item.detail}</p>
                          </div>
                          {item.href && (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
                              title="원문 사이트 이동"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Global Cross-Border Specimen Handling Policy */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/70 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-xs font-black text-stone-900">지역별 맞춤형 API 및 법적 지위 연동</h4>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  • <strong>글로벌 및 해외 접속자 (미국·일본·중국·유럽 등)</strong>: 현지 언어 설정 및 지역 노드에 맞춰 GBIF 글로벌 발생 기록, IUCN 적색목록(Red List), CITES 국제협약 데이터를 우선 연동합니다.<br/>
                  • <strong>한국 접속자</strong>: 국립생물자원관(NIBR) 국가생물종목록 및 환경부 오픈 공공 데이터를 결합하여 국내 법정 보호종 여부를 정확히 안내합니다.
                </p>
              </div>

              {/* Bottom Policy Notice (extra bottom spacing prevents cutoff) */}
              <div className="px-3 py-3 rounded-xl bg-stone-200/60 text-center space-y-1">
                <p className="text-[11px] font-medium text-stone-600">
                  자료마다 이용 조건이 달라요 · 사진·소리는 실제 작가 및 라이선스 표기
                </p>
                <p className="text-[10px] font-mono text-stone-400">
                  2026-11-25 기준 (글로벌 상업 라이선스 검증 완료)
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
