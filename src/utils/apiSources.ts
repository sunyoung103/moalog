export interface ApiSourceConfig {
  tag: string;         // e.g., "iNaturalist · GBIF"
  shortTag: string;    // e.g., "iNaturalist · GBIF"
  fullLabel: string;   // e.g., "iNaturalist Taxa API · GBIF Backbone Taxonomy"
  sourceName: string;  // e.g., "iNaturalist Open REST API & GBIF Backbone Taxonomy"
  lastUpdated: string; // e.g., "2026.09.20 (실시간 동기화)"
}

export const API_SOURCES = {
  general: {
    tag: "iNaturalist · GBIF",
    shortTag: "iNaturalist · GBIF",
    fullLabel: "iNaturalist Taxa API · GBIF Backbone Taxonomy",
    sourceName: "iNaturalist Open REST API & GBIF Backbone Taxonomy",
    lastUpdated: "2026.09.20 (실시간 동기화)",
  },
  appearance: {
    tag: "GBIF · iNaturalist",
    shortTag: "GBIF · iNaturalist",
    fullLabel: "GBIF Specimen Morphometrics · iNaturalist Taxa API",
    sourceName: "GBIF Global Specimen Database & iNaturalist Taxa API",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  habitat: {
    tag: "iNaturalist Obs",
    shortTag: "iNaturalist Obs",
    fullLabel: "iNaturalist Global Geo-Spatial Observations API",
    sourceName: "iNaturalist Open REST API (api.inaturalist.org/v1/observations)",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  dietAndBehavior: {
    tag: "GBIF · EOL Traits",
    shortTag: "GBIF · EOL Traits",
    fullLabel: "GBIF Species Traits · Encyclopedia of Life (EOL) TraitBank",
    sourceName: "GBIF Species Trait Data & Encyclopedia of Life (EOL) TraitBank",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  etymology: {
    tag: "GBIF Backbone",
    shortTag: "GBIF Backbone",
    fullLabel: "GBIF Backbone Taxonomy · Catalogue of Life (CoL)",
    sourceName: "GBIF Species Match REST API (api.gbif.org/v1/species/match)",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  conservation: {
    tag: "IUCN Red List",
    shortTag: "IUCN Red List",
    fullLabel: "IUCN Red List of Threatened Species · CITES Species+",
    sourceName: "IUCN Red List Global API & CITES Species+ Database",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  taxonomy: {
    tag: "iNaturalist · GBIF",
    shortTag: "iNaturalist · GBIF",
    fullLabel: "iNaturalist Taxonomy Hierarchy · GBIF Backbone",
    sourceName: "iNaturalist Ancestor Hierarchy & GBIF Backbone Taxonomy",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  fieldNotes: {
    tag: "iNaturalist · BHL",
    shortTag: "iNaturalist · BHL",
    fullLabel: "iNaturalist Global Field Notes & Biodiversity Heritage Library",
    sourceName: "iNaturalist Field Observations & BHL Natural History Archives",
    lastUpdated: "2026.09.20 (실시간 연동)",
  },
  keyIdentification: {
    tag: "GBIF · iNaturalist",
    shortTag: "GBIF Morphometrics",
    fullLabel: "GBIF Specimen Morphometrics REST API · iNaturalist Taxon Key Traits",
    sourceName: "GBIF Backbone Taxonomy (api.gbif.org) & iNaturalist Taxa API",
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
    fullLabel: "iNaturalist Observations Histogram REST API (api.inaturalist.org/v1/observations/histogram)",
    sourceName: "iNaturalist Global Geo-Spatial & Monthly Phenology Histogram API",
    lastUpdated: "실시간 동기화",
  },
  habitatField: {
    tag: "GBIF · iNat Geo",
    shortTag: "GBIF · iNat Geo",
    fullLabel: "GBIF Global Occurrence Data & iNaturalist Geo-Spatial API",
    sourceName: "GBIF Occurrence REST API & iNaturalist Geo-Spatial Observations API",
    lastUpdated: "실시간 동기화",
  },
  fieldEtiquette: {
    tag: "IUCN · WDPA",
    shortTag: "IUCN · WDPA",
    fullLabel: "IUCN Field Ethics & World Database on Protected Areas (WDPA)",
    sourceName: "IUCN Species Survival Commission Protocols & UNEP-WCMC WDPA Guidelines",
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
    tag: "GBIF · IUCN Red List",
    shortTag: "GBIF · IUCN Red List",
    fullLabel: "GBIF Species Traits & IUCN Red List Global Assessment",
    sourceName: "GBIF Bio-Diversity Indexes & IUCN Red List Criteria",
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
