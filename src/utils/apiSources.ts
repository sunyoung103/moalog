export interface ApiSourceConfig {
  tag: string;         // e.g., "iNaturalist · GBIF"
  shortTag: string;    // e.g., "iNaturalist · GBIF"
  fullLabel: string;   // e.g., "iNaturalist Taxa API · GBIF Backbone Taxonomy"
  sourceName: string;  // e.g., "iNaturalist Open REST API & GBIF Backbone Taxonomy"
  lastUpdated: string; // e.g., "2026.09.20 (실시간 동기화)"
}

export const API_SOURCES = {
  general: {
    tag: "iNaturalist · GBIF (CC BY 4.0)",
    shortTag: "iNaturalist · GBIF",
    fullLabel: "iNaturalist Taxa API · GBIF Backbone Taxonomy (CC BY 4.0)",
    sourceName: "iNaturalist Open Taxa API & GBIF Backbone Taxonomy (CC BY 4.0)",
    lastUpdated: "2026.09.20 (실시간 동기화)",
  },
  appearance: {
    tag: "GBIF · iNaturalist",
    shortTag: "GBIF · iNaturalist",
    fullLabel: "GBIF Specimen Morphometrics (CC BY 4.0) · iNaturalist Taxa",
    sourceName: "GBIF Global Specimen Database (CC BY 4.0) & iNaturalist Taxa API",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  habitat: {
    tag: "iNaturalist Obs",
    shortTag: "iNaturalist Obs",
    fullLabel: "iNaturalist Global Geo-Spatial Observations Statistics",
    sourceName: "iNaturalist Open Geo-Spatial Statistics API",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  dietAndBehavior: {
    tag: "GBIF · EOL Traits",
    shortTag: "GBIF · EOL Traits",
    fullLabel: "GBIF Species Traits (CC BY 4.0) · Encyclopedia of Life (EOL) TraitBank",
    sourceName: "GBIF Species Trait Data (CC BY 4.0) & Encyclopedia of Life (EOL) TraitBank",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  etymology: {
    tag: "GBIF Backbone (CC BY 4.0)",
    shortTag: "GBIF Backbone",
    fullLabel: "GBIF Backbone Taxonomy (CC BY 4.0) · Catalogue of Life (CoL)",
    sourceName: "GBIF Species Match REST API (api.gbif.org/v1/species/match · CC BY 4.0)",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  conservation: {
    tag: "한국의 멸종위기종 · NIBR",
    shortTag: "NIBR · 환경부",
    fullLabel: "환경부 한국의 멸종위기종 · 국립생물자원관(NIBR) 국가생물종목록",
    sourceName: "환경부 한국의 멸종위기종 & 국립생물자원관(NIBR) 국가생물종목록",
    lastUpdated: "2026.09.20 (공공 데이터 기준)",
  },
  taxonomy: {
    tag: "iNaturalist · GBIF",
    shortTag: "iNaturalist · GBIF",
    fullLabel: "iNaturalist Taxonomy Hierarchy · GBIF Backbone (CC BY 4.0)",
    sourceName: "iNaturalist Ancestor Hierarchy & GBIF Backbone Taxonomy (CC BY 4.0)",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  fieldNotes: {
    tag: "iNaturalist · BHL",
    shortTag: "iNaturalist · BHL",
    fullLabel: "iNaturalist Global Field Notes & Biodiversity Heritage Library",
    sourceName: "iNaturalist Field Stats & BHL Natural History Archives",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  keyIdentification: {
    tag: "GBIF · iNaturalist",
    shortTag: "GBIF Morphometrics",
    fullLabel: "GBIF Specimen Morphometrics (CC BY 4.0) · iNaturalist Taxon Key Traits",
    sourceName: "GBIF Backbone Taxonomy (api.gbif.org · CC BY 4.0) & iNaturalist Taxa API",
    lastUpdated: "실시간 동기화",
  },
  observationGuide: {
    tag: "iNaturalist · BHL",
    shortTag: "iNat Field Guide",
    fullLabel: "iNaturalist Field Observation Protocols & Biodiversity Heritage Library",
    sourceName: "iNaturalist Field Observation API & BHL Natural History Archives",
    lastUpdated: "실시간 동기화",
  },
  phenologyHistogram: {
    tag: "iNaturalist Histogram",
    shortTag: "iNat Histogram API",
    fullLabel: "iNaturalist Observations Histogram REST API (통계 집계)",
    sourceName: "iNaturalist Global Geo-Spatial & Monthly Phenology Histogram API",
    lastUpdated: "실시간 동기화",
  },
  habitatField: {
    tag: "GBIF · iNat Geo",
    shortTag: "GBIF · iNat Geo",
    fullLabel: "GBIF Global Occurrence Data (CC BY 4.0) & iNaturalist Geo-Spatial API",
    sourceName: "GBIF Occurrence REST API (CC BY 4.0) & iNaturalist Geo-Spatial API",
    lastUpdated: "실시간 동기화",
  },
  fieldEtiquette: {
    tag: "NIBR · WDPA",
    shortTag: "NIBR · WDPA",
    fullLabel: "국립생물자원관 탐사 윤리 수칙 · World Database on Protected Areas (WDPA)",
    sourceName: "국립생물자원관(NIBR) 야생생물 관찰 수칙 & UNEP-WCMC WDPA Guidelines",
    lastUpdated: "실시간 동기화",
  },
  phenology: {
    tag: "iNaturalist Geo-API",
    shortTag: "iNaturalist Geo-API",
    fullLabel: "iNaturalist Open Geo-Spatial & Monthly Phenology API",
    sourceName: "iNaturalist Observations Histogram API & Phenology Records",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  ecoDex: {
    tag: "GBIF · NIBR 보전지수",
    shortTag: "GBIF · NIBR",
    fullLabel: "GBIF Species Traits (CC BY 4.0) · NIBR 국가생물종 보전 평가",
    sourceName: "GBIF Bio-Diversity Indexes (CC BY 4.0) & NIBR 보전 지표",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  photoArtVision: {
    tag: "Gemini Vision AI",
    shortTag: "Gemini Vision",
    fullLabel: "Google Gemini Multimodal Vision API · Global Bio-Aesthetics Engine",
    sourceName: "Google Gemini 2.5 Flash Multimodal Vision Real-time Composition Analysis",
    lastUpdated: "실시간 비전 분석",
  },
} as const;


export type ApiSourceCategory = keyof typeof API_SOURCES;

/**
 * Helper function to retrieve standardized API source attribution metadata.
 */
export function getApiSource(category: ApiSourceCategory = 'general', customSource?: string): ApiSourceConfig {
  const config = API_SOURCES[category] || API_SOURCES.general;
  
  if (customSource && customSource.trim().length > 0) {
    return {
      ...config,
      fullLabel: customSource,
      sourceName: customSource,
    };
  }

  return config;
}

/**
 * Returns shared identification card metadata for consistent source attribution across all views.
 */
export function getIdentificationSourceMetadata(category: ApiSourceCategory = 'general', customSource?: string) {
  const source = getApiSource(category, customSource);
  return {
    sourceName: source.sourceName,
    lastUpdated: source.lastUpdated,
    fullLabel: source.fullLabel,
    tag: source.tag,
    shortTag: source.shortTag,
  };
}
