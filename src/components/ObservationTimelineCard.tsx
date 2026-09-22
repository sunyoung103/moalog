import React, { useState } from 'react';
import { Specimen, Observation } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  Camera,
  Plus,
  Sparkles,
  CheckCircle2,
  Eye,
  Crown,
  Focus,
  X,
  Send,
  ArrowDownUp,
  Tag,
  Compass,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ObservationTimelineCardProps {
  specimen: Specimen;
  observations: Observation[];
  selectedIndex: number;
  onSelectObservation: (index: number) => void;
  onAddObservation: (specimenId: string, observation: Observation) => void;
}

export const ObservationTimelineCard: React.FC<ObservationTimelineCardProps> = ({
  specimen,
  observations,
  selectedIndex,
  onSelectObservation,
  onAddObservation,
}) => {
  // Sorting order: 'newest' | 'oldest'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // View mode: 'detailed' | 'compact'
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');

  // Add Observation Form Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0].replace(/-/g, '.'));
  const [newTime, setNewTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    return `${ampm} ${formattedHours}:${minutes}`;
  });
  const [newLocation, setNewLocation] = useState(specimen.locationCoord?.name || '서울숲 야외 생태원');
  const [newWeather, setNewWeather] = useState('☀️ 맑음');
  const [newTemperature, setNewTemperature] = useState('25°C');
  const [newPhotoUrl, setNewPhotoUrl] = useState(specimen.originalImage || '');
  const [newMemo, setNewMemo] = useState('');

  // Index map to preserve original indices when sorted
  const sortedItems = observations
    .map((obs, originalIdx) => ({ obs, originalIdx }))
    .sort((a, b) => {
      const dateA = a.obs.date || '';
      const dateB = b.obs.date || '';
      return sortOrder === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });

  // Calculate timeline delta insights
  const getTimelineInsight = (originalIdx: number) => {
    if (originalIdx === 0) {
      return { tag: '최초 발견 등록', icon: '🌟', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    const prevObs = observations[originalIdx - 1];
    const currentObs = observations[originalIdx];
    
    if (prevObs && prevObs.location !== currentObs.location) {
      return { tag: '새로운 위치 관찰', icon: '📍', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
    return { tag: '동일 서식지 재포착', icon: '🔁', color: 'bg-blue-100 text-blue-900 border-blue-300' };
  };

  const handleCreateObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemo.trim()) return;

    const newObs: Observation = {
      id: `obs-${Date.now()}`,
      date: newDate,
      time: newTime,
      location: newLocation.trim() || '야외 생태 서식지',
      weather: newWeather,
      temperature: newTemperature,
      photoUrl: newPhotoUrl || specimen.originalImage || specimen.stickerImage || '',
      memo: newMemo.trim(),
      focusAfMode: 'Spot Tap-AF',
      focusPoint: { x: 50, y: 50 },
    };

    onAddObservation(specimen.id, newObs);
    setIsAddModalOpen(false);
    setNewMemo('');
    // Automatically select the newly created observation
    onSelectObservation(0);
  };

  const firstDate = observations[observations.length - 1]?.date || '관찰 기록 없음';
  const latestDate = observations[0]?.date || '관찰 기록 없음';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-4 text-stone-900 select-none">
      {/* Timeline Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-150 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest">
              OBSERVATION TIMELINE FLOW
            </span>
          </div>
          <h3 className="text-base font-black text-stone-900 flex items-center gap-2 mt-0.5">
            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{specimen.koreanName} 날짜별 관찰 타임라인</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              총 {observations.length}회 기록
            </span>
          </h3>
        </div>

        {/* Action Controls & Add Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Order Sort Button */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="정렬 변경"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-stone-500" />
            <span>{sortOrder === 'newest' ? '최신순' : '오래된순'}</span>
          </button>

          {/* Compact / Detailed View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
            className="px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <span>{viewMode === 'detailed' ? '📋 요약형' : '📜 상세형'}</span>
          </button>

          {/* Add Observation Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 관찰 추가</span>
          </button>
        </div>
      </div>

      {/* Overview Summary Banner */}
      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>최초 발견: <strong className="text-stone-900 font-mono">{firstDate}</strong></span>
          </div>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>최근 관찰: <strong className="text-stone-900 font-mono">{latestDate}</strong></span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-stone-500 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
          💡 타임라인 카드를 클릭하면 상세 보기 사진이 즉시 전환됩니다.
        </div>
      </div>

      {/* Timeline Stream Area */}
      {viewMode === 'detailed' ? (
        <div className="relative pl-3 sm:pl-4 space-y-4 pt-2 pb-1">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[18px] sm:left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-stone-700" />

          {sortedItems.map(({ obs, originalIdx }, displaySeq) => {
            const isSelected = selectedIndex === originalIdx;
            const isRepPhoto = obs.photoUrl === specimen.originalImage || originalIdx === 0;
            const insight = getTimelineInsight(originalIdx);

            return (
              <motion.div
                key={obs.id || originalIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: displaySeq * 0.05 }}
                onClick={() => onSelectObservation(originalIdx)}
                className={`relative pl-8 sm:pl-9 transition-all cursor-pointer group ${
                  isSelected ? 'z-10' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Glowing Node Marker */}
                <div
                  className={`absolute left-0 top-3.5 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-black transition-all shadow-md ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/30 scale-110 shadow-amber-400/50'
                      : 'bg-stone-800 text-stone-300 border border-stone-600 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}
                >
                  {observations.length - originalIdx}
                </div>

                {/* Timeline Item Card */}
                <div
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                    isSelected
                      ? 'bg-stone-50 border-emerald-600 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  {/* Top Bar: Date, Time, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 border-b border-stone-150 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-stone-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        {obs.date}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-500">
                        {obs.time}
                      </span>
                      {isRepPhoto && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600 fill-amber-600" />
                          도감 대표 사진
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${insight.color}`}>
                        {insight.icon} {insight.tag}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-white flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          현재 선택됨
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Content Layout: Left Thumbnail + Right Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    {/* Thumbnail Image Frame */}
                    <div className="sm:col-span-1 relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group-hover:border-stone-300 transition-all shadow-2xs">
                      <img
                        src={obs.photoUrl || specimen.originalImage || specimen.stickerImage || ''}
                        alt={`${specimen.koreanName} 관찰`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[9px] font-bold text-white flex items-center gap-1">
                          <Eye className="w-3 h-3" /> 확대 적용
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Observation Field Memo */}
                    <div className="sm:col-span-3 space-y-2">
                      {/* Location & Weather Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[220px]">{obs.location}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                          <CloudSun className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                          <span>{obs.weather}</span>
                          <span className="font-mono text-stone-500">({obs.temperature})</span>
                        </div>
                      </div>

                      {/* Memo Box */}
                      <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/80 text-xs leading-relaxed text-stone-700">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                          <p className="font-medium text-stone-800">
                            {obs.memo || '자연 서식 환경에서 포착된 개체입니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Compact Horizontal List View */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {sortedItems.map(({ obs, originalIdx }) => {
            const isSelected = selectedIndex === originalIdx;
            return (
              <button
                key={obs.id || originalIdx}
                type="button"
                onClick={() => onSelectObservation(originalIdx)}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-950 border-amber-400 ring-2 ring-amber-400/40 text-white shadow-lg'
                    : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-800 bg-stone-900">
                  <img
                    src={obs.photoUrl || specimen.originalImage || ''}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-white">{obs.date}</span>
                    <span className="text-[10px] text-amber-400 font-bold">#{observations.length - originalIdx}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{obs.location}</p>
                  <p className="text-[10px] text-stone-500 truncate mt-0.5">{obs.memo || '관찰 메모'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add Observation Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 text-stone-100 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-stone-700 shadow-2xl space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{specimen.koreanName} 새 관찰 추가</h4>
                    <span className="text-[10px] text-stone-400">현장 포착 날짜와 생태 메모를 기록하세요</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleCreateObservation} className="space-y-3 text-xs">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">관찰 일자</label>
                    <input
                      type="text"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      placeholder="2026.08.20"
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">관찰 시간</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="오후 02:30"
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">관찰 장소</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="서울숲 열매나무 숲길"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Weather & Temperature */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">기상 상태</label>
                    <select
                      value={newWeather}
                      onChange={(e) => setNewWeather(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="☀️ 맑음">☀️ 맑음</option>
                      <option value="🌤️ 구름조금">🌤️ 구름조금</option>
                      <option value="☁️ 흐림">☁️ 흐림</option>
                      <option value="🌧️ 비">🌧️ 비</option>
                      <option value="🍃 바람">🍃 바람</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">기온</label>
                    <input
                      type="text"
                      value={newTemperature}
                      onChange={(e) => setNewTemperature(e.target.value)}
                      placeholder="25°C"
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Photo Selection Preset */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">관찰 사진 URL</label>
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white focus:border-emerald-500 focus:outline-none font-mono text-[10px]"
                  />
                </div>

                {/* Observation Memo */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">생태 관찰 메모</label>
                  <textarea
                    rows={3}
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    placeholder="개체의 먹이 활동, 날개짓, 울음소리 및 특이 행동을 기록하세요."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg border border-emerald-400/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>기록 추가 저장</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
