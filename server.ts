import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Server-side Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Moalog", timestamp: new Date().toISOString() });
});

// AI Species Identification endpoint
app.post("/api/identify", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", hint = "", lat, lng, timestamp, persona = "general" } = req.body;

    const ai = getGemini();
    if (!ai) {
      // Return structured fallback if no API key provided
      return res.json({
        success: true,
        isFallback: true,
        data: getFallbackIdentification(hint),
      });
    }

    let personaContext = "";
    if (persona === "birder") {
      personaContext = "사용자는 탐조(새) 전문가입니다. 조류의 경우 날개깃(Primary/Secondary), 부리 형태, 울음소리 패턴 등 조류학적 전문 용어를 활용해 특징을 서술해주세요.";
    } else if (persona === "botanist") {
      personaContext = "사용자는 식물학자입니다. 잎차례, 꽃차례, 관다발 구조, 생식 기관 등 식물학적 형태 형질에 집중하여 전문적으로 서술해주세요.";
    } else if (persona === "mammalogist") {
      personaContext = "사용자는 포유류 전문가입니다. 발자국, 배설물 흔적, 골격 특징, 식성 및 행동 생태학적 관점에서 서술해주세요.";
    } else if (persona === "entomologist") {
      personaContext = "사용자는 곤충학자입니다. 날개맥 구조, 더듬이 형태, 변태 과정(완전/불완전), 기주식물 등 곤충학적 전문 지식을 바탕으로 서술해주세요.";
    }

    const systemPrompt = `당신은 대한민국 및 글로벌 생태계 전문 생물학자이자 분류학 전문가입니다.
사용자가 촬영한 생물(식물, 조류, 곤충, 포유류 등) 사진과 (주어질 경우) 위치, 시간 정보를 분석하여 다음 JSON 형식으로 정확한 분류학 및 생태 정보를 반환하세요.
**미등록/알수없는 생물 처리 원칙:** 만약 사진이 흐릿하거나 정확한 종 단위 동정이 불가능할 경우, 가장 가까운 과(Family)나 속(Genus) 단위까지만 식별하고(예: '알 수 없는 장미과 식물', '분류 미상 딱정벌레'), confidence를 낮추어(50~70) 반환하세요.

${personaContext}

반환할 JSON 구조:
1. koreanName: 한국어 통용 종명 (예: 서양민들레, 직박구리, 왕벚나무)
2. scientificName: 학명 (이탤릭체 라틴어, 예: Taraxacum officinale)
3. category: 'plants' | 'birds' | 'insects' | 'mammals' | 'others' 중 하나
4. confidence: 0~99 사이의 정수 일치율 퍼센트 (불확실할수록 낮게 설정)
5. family: '과' 명칭 (예: 국화과 Asteraceae, 직박구리과 Pycnonotidae)
6. genus: '속' 명칭 (예: 민들레속 Taraxacum)
7. taxonomyPath: ['식물계', '속씨식물문', '쌍떡잎식물강', '국화목', '국화과', '민들레속', '서양민들레'] 와 같은 7단계 분류 트리 배열
8. traitChips: 핵심 생태 및 개체 특징 3~4개 (예: ['쌍떡잎식물', '다년생초본', '노란 꽃', '도심/초지 서식'] 또는 ['텃새', '몸길이 28cm', '과실류/곤충 섭식', '도시공원 흔함'])
9. habitatType: '도시/공원' | '산림/숲' | '습지/하천' | '초지/들판' | '연안/바다' 중 하나
10. wikiSummary: 위키백과 스타일의 정확하고 정갈한 2~3줄 생태 요약
11. wikiUrl: 한국어 위키백과 URL (예: https://ko.wikipedia.org/wiki/서양민들레)
12. seasonalTip: 현재 관찰 시기에 대한 짧은 팁 (예: 봄~가을 꽃이 피며 바람에 홀씨가 날립니다)
13. detectedHabitatName: 위도/경도가 주어질 경우 해당 지역의 구체적 서식지 명칭 또는 랜드마크 (예: '서울숲 습지생태원', '제주도 한라산 1000m 고지대'). 모를 경우 일반적인 장소명.
14. environmentalCharacteristics: 해당 지역 좌표의 주요 환경적 특징 1~2문장 (예: '도심 속 수변 공간으로 갈대밭이 어우러져 수생 조류 서식에 적합합니다.').
15. candidates: 1순위를 제외한 2~4순위 후보 생물 배열 (비슷한 외형을 가진 종들). 각 항목은 koreanName, scientificName, confidence, family, genus, category 포함.`;

    let contents: any;
    let promptText = "사진 속 생물의 종명, 학명, 분류 체계, 생태 특징을 정밀 분석해주세요.";
    if (hint) promptText += ` 힌트: ${hint}`;
    if (lat && lng) promptText += `\n촬영 위치 좌표: 위도 ${lat}, 경도 ${lng}. 해당 좌표의 지역 서식지 명칭과 환경 특성을 추출해주세요.`;
    if (timestamp) promptText += `\n촬영 일시: ${timestamp}`;

    if (imageBase64) {
      // Remove data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      contents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: promptText,
          },
        ],
      };
    } else {
      contents = `생물 분석 요청: ${promptText}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            koreanName: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            category: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            family: { type: Type.STRING },
            genus: { type: Type.STRING },
            taxonomyPath: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            traitChips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            habitatType: { type: Type.STRING },
            wikiSummary: { type: Type.STRING },
            wikiUrl: { type: Type.STRING },
            seasonalTip: { type: Type.STRING },
            detectedHabitatName: { type: Type.STRING, nullable: true },
            environmentalCharacteristics: { type: Type.STRING, nullable: true },
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  koreanName: { type: Type.STRING },
                  scientificName: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  family: { type: Type.STRING },
                  genus: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["koreanName", "scientificName", "confidence", "family"]
              }
            }
          },
          required: [
            "koreanName",
            "scientificName",
            "category",
            "confidence",
            "family",
            "genus",
            "taxonomyPath",
            "traitChips",
            "habitatType",
            "wikiSummary",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error("Gemini identify error:", error);
    // Graceful fallback so user never gets blocked
    const fallbackData = getFallbackIdentification(req.body.hint || "서양민들레");
    res.json({
      success: true,
      isFallback: true,
      data: fallbackData,
    });
  }
});

function getFallbackIdentification(hint: string) {
  const query = (hint || "").toLowerCase();
  if (query.includes("직박구리") || query.includes("bird") || query.includes("새")) {
    return {
      koreanName: "직박구리",
      scientificName: "Hypsipetes amaurotis",
      category: "birds",
      confidence: 97,
      family: "직박구리과 (Pycnonotidae)",
      genus: "직박구리속 (Hypsipetes)",
      taxonomyPath: ["동물계", "척삭동물문", "조강", "참새목", "직박구리과", "직박구리속", "직박구리"],
      traitChips: ["텃새", "몸길이 약 28cm", "갈색 귀깃", "과실류/곤충 섭식", "도시공원 흔함"],
      habitatType: "도시/공원",
      wikiSummary: "직박구리는 참새목 직박구리과의 흔한 텃새입니다. 회갈색 몸통통통과 뺨의 밤색 깃이 특징이며, '삐익- 삐익-' 하는 청명하고 날카로운 소리로 웁니다. 봄에는 벚나무 꿀, 가을에는 감이나 열매를 즐겨 먹습니다.",
      wikiUrl: "https://ko.wikipedia.org/wiki/%EC%A7%81%EB%B0%95%EA%B5%AC%EB%A6%AC",
      seasonalTip: "도시 공원과 아파트 화단에서도 일 년 내내 쉽게 관찰되는 대표적인 텃새입니다.",
    };
  }

  if (query.includes("호랑나비") || query.includes("나비") || query.includes("butterfly") || query.includes("insect")) {
    return {
      koreanName: "호랑나비",
      scientificName: "Papilio xuthus",
      category: "insects",
      confidence: 96,
      family: "호랑나비과 (Papilionidae)",
      genus: "호랑나비속 (Papilio)",
      taxonomyPath: ["동물계", "절지동물문", "곤충강", "나비목", "호랑나비과", "호랑나비속", "호랑나비"],
      traitChips: ["나비목", "날개길이 45~60mm", "호랑이 무늬", "운향과 기주식물", "주행성"],
      habitatType: "초지/들판",
      wikiSummary: "호랑나비는 호랑나비과의 대표적인 곤충으로, 노란빛 바탕에 검은 줄무늬가 호랑이 털 무늬를 닮았습니다. 봄부터 가을까지 양지바른 숲길이나 꽃밭에서 꿀을 빱니다.",
      wikiUrl: "https://ko.wikipedia.org/wiki/%ED%98%B8%EB%9E%91%EB%82%98%EB%B9%84",
      seasonalTip: "화창한 한낮에 백일홍이나 라일락 꽃 주위를 맴돌며 날갯짓하는 모습을 자주 볼 수 있습니다.",
    };
  }

  if (query.includes("다람쥐") || query.includes("squirrel") || query.includes("mammal")) {
    return {
      koreanName: "다람쥐",
      scientificName: "Tamias sibiricus",
      category: "mammals",
      confidence: 98,
      family: "다람쥐과 (Sciuridae)",
      genus: "다람쥐속 (Tamias)",
      taxonomyPath: ["동물계", "척삭동물문", "포유강", "설치목", "다람쥐과", "다람쥐속", "다람쥐"],
      traitChips: ["포유류", "등에 5개 검은 줄", "볼주머니", "도토리 저장", "주행성"],
      habitatType: "산림/숲",
      wikiSummary: "다람쥐는 등에 선명한 5개의 검은 줄무늬가 있는 귀여운 설치류입니다. 도토리, 밤, 잣 등의 나무 열매를 볼주머니에 가득 채워 땅속 저장고에 묻어두는 습성이 있습니다.",
      wikiUrl: "https://ko.wikipedia.org/wiki/%EC%8B%9C%EB%B2%A0%EB%A6%AC%EC%95%84%EB%8B%A4%EB%9E%8C%EC%A5%90",
      seasonalTip: "침엽수림과 활엽수림 바닥에서 바쁘게 열매를 모으는 모습을 관찰할 수 있습니다.",
    };
  }

  // Default: 서양민들레
  return {
    koreanName: "서양민들레",
    scientificName: "Taraxacum officinale",
    category: "plants",
    confidence: 99,
    family: "국화과 (Asteraceae)",
    genus: "민들레속 (Taraxacum)",
    taxonomyPath: ["식물계", "속씨식물문", "쌍떡잎식물강", "국화목", "국화과", "민들레속", "서양민들레"],
    traitChips: ["쌍떡잎식물", "다년생초본", "노란 두상화", "총포편 뒤로 젖혀짐", "도시/초지 서식"],
    habitatType: "도시/공원",
    wikiSummary: "서양민들레는 국화과 민들레속에 속하는 여러해살이풀입니다. 토종 민들레와 달리 꽃받침(총포 조각)이 아래로 완전히 젖혀져 있는 것이 특징입니다. 꽃이 진 후 하얀 솜털 같은 갓털(관모)을 둥글게 피워 바람에 씨앗을 퍼뜨립니다.",
    wikiUrl: "https://ko.wikipedia.org/wiki/%EC%84%9C%EC%96%91%EB%AF%BC%EB%93%A4%EB%A0%88",
    seasonalTip: "봄부터 늦가을까지 길가, 공원 잔디밭 등 양지바른 곳 어디에서나 번식력이 강하게 자랍니다.",
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Moalog server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
