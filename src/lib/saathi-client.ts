export type Verdict = "safe" | "caution" | "avoid" | "info";

export interface SourceRef {
  title: string;
  detail?: string;
}

export interface ClientAnswer {
  text: string;
  verdict: Verdict;
  station?: string;
  category?: string;
  monthLabel?: string;
  sources: SourceRef[];
}

export interface ClientKbEntry {
  id: number;
  kind: string;
  title: string;
  station: string | null;
  category: string | null;
  monthLabel: string | null;
}

const STATIONS = [
  { name: "Upstream Gomti (Kukrail)", short: "Kukrail", category: "C", aliases: ["kukrail", "upstream", "origin"] },
  { name: "Gaughat", short: "Gaughat", category: "D", aliases: ["gaughat", "gao ghat", "gau ghat"] },
  { name: "Kudiyaghat", short: "Kudiyaghat", category: "D", aliases: ["kudiyaghat", "kudiya ghat", "kudiya"] },
  { name: "Nishatganj", short: "Nishatganj", category: "E", aliases: ["nishatganj", "nishat ganj", "nishat"] },
  { name: "Gomti Barrage", short: "Gomti Barrage", category: "E", aliases: ["barrage", "gomti barrage"] },
  { name: "Downstream Gomti Barrage (Dilkusha)", short: "Dilkusha", category: "E", aliases: ["dilkusha", "downstream", "after barrage"] },
] as const;

const latestMonth = new Date().toLocaleString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const stationContent: Record<string, string> = {
  "Upstream Gomti (Kukrail)":
    "Monitoring station: Upstream Gomti at Kukrail, Lucknow. Designated best-use category: C. Dissolved oxygen is fair, but faecal coliform exceeds the bathing limit. Direct contact should be limited; the water is not recommended for bathing or washing.",
  Gaughat:
    "Monitoring station: Gaughat, Lucknow. Designated best-use category: D. Dissolved oxygen is low and faecal coliform is high. The stretch receives domestic sewage from city drains. Bathing and washing are not advised; avoid prolonged contact with the water.",
  Kudiyaghat:
    "Monitoring station: Kudiyaghat, Lucknow. Designated best-use category: D. Low dissolved oxygen and elevated faecal coliform due to sewage discharge. Bathing, washing and fishing are not advised at this stretch.",
  Nishatganj:
    "Monitoring station: Nishatganj stretch, Lucknow. Designated best-use category: E. Sewage discharge causes persistent foam near drains and oxygen levels are very low. Avoid all direct contact with the water.",
  "Gomti Barrage":
    "Monitoring station: Gomti Barrage, Lucknow. Designated best-use category: E. The water is not suitable for bathing, washing, fishing or any water contact. Children should remain on the bank.",
  "Downstream Gomti Barrage (Dilkusha)":
    "Monitoring station: Downstream of Gomti Barrage near Dilkusha, Lucknow. Designated best-use category: E. The downstream stretch carries the accumulated sewage load of the city; avoid all direct contact with the water.",
};

const FAQS = [
  {
    title: "Does rain make the river safe?",
    tags: ["rain", "baarish", "barish", "monsoon", "weather"],
    content:
      "Rain does not make the river safe. Heavy rain can wash drains, garbage and sewage into the Gomti, so pollution load may rise after storms. Dilution can make the water look better temporarily, but appearance is not a safety test. Always rely on the latest official advisory.",
  },
  {
    title: "What does foam on the river mean?",
    tags: ["foam", "jhag", "froth", "detergent", "sewage"],
    content:
      "White foam on the Gomti usually indicates detergents and untreated sewage mixing into the river, especially near drain outfalls such as Nishatganj. Avoid touching the foam or nearby water and keep children away from it.",
  },
  {
    title: "Water looks clean — is it safe?",
    tags: ["looks", "clean", "appearance", "colour", "smell"],
    content:
      "Appearance does not reveal bacteria, dissolved oxygen or pollution load. Water can look clean while still carrying faecal contamination. Safety decisions should use monitoring data rather than colour or smell.",
  },
  {
    title: "Children playing near the river",
    tags: ["children", "kids", "play", "bachche", "khel", "school"],
    content:
      "Children may stay on the river bank, but on stretches classified Category D or E they should not enter the water. Wash hands with soap after accidental contact and keep children away from foam patches and drain outfalls.",
  },
];

const CATEGORIES: Record<string, string> = {
  A: "Category A is the highest class — a drinking-water source after disinfection.",
  B: "Category B is suitable for organised outdoor bathing.",
  C: "Category C is a drinking-water source after conventional treatment and is not the bathing category.",
  D: "Category D supports wildlife and fisheries; bathing and washing are not advised.",
  E: "Category E is the lowest class, intended for irrigation, industrial cooling and controlled waste disposal — not for bathing, washing or direct contact.",
};

export const KB_ENTRIES: ClientKbEntry[] = [
  ...STATIONS.map((s, i) => ({
    id: i + 1,
    kind: "advisory",
    title: `Monthly water-quality advisory — ${s.short} station`,
    station: s.name,
    category: s.category,
    monthLabel: latestMonth,
  })),
  ...Object.keys(CATEGORIES).map((letter, i) => ({
    id: 20 + i,
    kind: "criteria",
    title: `CPCB water-quality category ${letter}`,
    station: null,
    category: letter,
    monthLabel: null,
  })),
  ...FAQS.map((f, i) => ({
    id: 30 + i,
    kind: "faq",
    title: f.title,
    station: null,
    category: null,
    monthLabel: null,
  })),
];

function stationFor(q: string) {
  let found: (typeof STATIONS)[number] | undefined;
  for (const s of STATIONS) {
    if (s.aliases.some((a) => q.includes(a))) {
      found = s;
      break;
    }
  }
  return found;
}

function language(q: string) {
  if (/[ऀ-ॿ]/.test(q)) return "hi";
  if (/(kya|hai|hain|ke|ki|paas|nahana|nahane|dhona|kapde|machhli|bachche|jhag|baarish|pani|paani|safe|khatarnak)/i.test(q)) return "hinglish";
  return "en";
}

function categoryAnswer(letter: string, lang: string): ClientAnswer {
  const en = CATEGORIES[letter];
  const hi = {
    A: "श्रेणी A सबसे उच्चतम वर्ग है — कीटाणुशोधन के बाद पेयजल स्रोत।",
    B: "श्रेणी B व्यवस्थित बाहरी स्नान के लिए उपयुक्त है।",
    C: "श्रेणी C पारंपरिक उपचार के बाद पेयजल स्रोत है — यह स्नान की श्रेणी नहीं है।",
    D: "श्रेणी D वन्यजीव और मत्स्य पालन के लिए है — स्नान और धुलाई की सलाह नहीं दी जाती।",
    E: "श्रेणी E सबसे निम्न जल-गुणवत्ता वर्ग है — स्नान, धुलाई या सीधे संपर्क के लिए उपयुक्त नहीं है।",
  }[letter];
  const hinglish = {
    A: "Category A sabse high class hai — disinfection ke baad drinking-water source.",
    B: "Category B organised outdoor bathing ke liye suitable hai.",
    C: "Category C conventional treatment ke baad drinking-water source hai — nahane ki category nahi.",
    D: "Category D wildlife aur fisheries ke liye hai — nahana ya dhona advise nahi kiya jata.",
    E: "Category E sabse low class hai — nahana, dhona ya direct contact nahi karna chahiye.",
  }[letter];
  return {
    text: (lang === "hi" ? hi : lang === "hinglish" ? hinglish : en) + "\n\nSource: CPCB water-quality classification criteria.",
    verdict: "info",
    category: letter,
    sources: [{ title: "CPCB water-quality classification criteria", detail: `Category ${letter}` }],
  };
}

function stationAnswer(st: (typeof STATIONS)[number], q: string, lang: string): ClientAnswer {
  const cat = st.category;
  const activity = /bath|nahana|nahane|swim|nha|नहा/.test(q)
    ? "bathing"
    : /wash|dhona|धो/.test(q)
      ? "washing"
      : /fish|machhli|मछल/.test(q)
        ? "fishing"
        : "contact";

  const verdict = cat === "A" || cat === "B" ? "safe" : cat === "C" ? "caution" : "avoid";

  const lead =
    lang === "hi"
      ? cat === "C"
        ? "सावधानी — इस हिस्से में पानी से संपर्क सीमित रखें।"
        : "पानी से सीधे संपर्क से बचें।"
      : lang === "hinglish"
        ? cat === "C"
          ? "Savdhani — paani se contact kam rakhein."
          : "Paani se direct contact se bachein."
        : cat === "C"
          ? "Caution — limit direct contact with the water."
          : "Avoid direct contact with the water.";

  const activityLine =
    activity === "bathing"
      ? lang === "hi"
        ? "स्नान के लिए इसकी सलाह नहीं दी जाती।"
        : lang === "hinglish"
          ? "Yahan nahana recommend nahi kiya jata."
          : "Bathing is not advised here."
      : activity === "washing"
        ? "Washing clothes in this stretch is not advised."
        : activity === "fishing"
          ? "Fishing is not advised at this stretch."
          : "Avoid unnecessary contact with the water.";

  return {
    text: `${lead}\n\n${stationContent[st.name]}\n\n${activityLine}\n\nSource: illustrative monthly advisory · ${latestMonth}.`,
    verdict,
    station: st.name,
    category: cat,
    monthLabel: latestMonth,
    sources: [{ title: "Monthly water-quality advisory", detail: `${st.short} · Category ${cat} · ${latestMonth}` }],
  };
}

export function answerQuestionClient(question: string): ClientAnswer {
  const q = question.trim().toLowerCase();
  const lang = language(q);

  const cat = q.match(/(?:category|shreni|वर्ग|श्रेणी|कैटेगरी)[s-]*([a-e])/i);
  if (cat) return categoryAnswer(cat[1].toUpperCase(), lang);

  const st = stationFor(q);

  if (/foam|jhag|froth|झाग|फेन/.test(q)) {
    const foamSt = st?.name ?? "Nishatganj";
    return {
      text:
        lang === "hi"
          ? `नदी पर झाग अक्सर डिटर्जेंट और अनुपचारित मलजल का संकेत है। ${foamSt} के पास इसे या पानी को न छुएँ और बच्चों को दूर रखें।\n\nSource: citizen FAQ + illustrative monthly advisory · ${latestMonth}.`
          : lang === "hinglish"
            ? `Nadi ka jhaag aksar detergent aur untreated sewage ka sanket hai. ${foamSt} ke paas jhaag ya paani ko touch na karein aur bachchon ko door rakhein.\n\nSource: citizen FAQ + illustrative monthly advisory · ${latestMonth}.`
            : `White foam usually indicates detergents and untreated sewage. Near ${foamSt}, avoid touching the foam or nearby water and keep children away.\n\nSource: citizen FAQ + illustrative monthly advisory · ${latestMonth}.`,
      verdict: "avoid",
      station: foamSt,
      category: st?.category ?? "E",
      monthLabel: latestMonth,
      sources: [
        { title: "What does foam on the river mean?", detail: "Citizen FAQ" },
        { title: "Monthly water-quality advisory", detail: `${foamSt} · ${latestMonth}` },
      ],
    };
  }

  if (/rain|baarish|barish|बारिश|monsoon/.test(q)) {
    const faq = FAQS[0];
    return {
      text: `${faq.content}\n\nSource: ${faq.title}.`,
      verdict: "caution",
      sources: [{ title: faq.title, detail: "Citizen FAQ" }],
    };
  }

  if (/looks clean|clean looking|saaf dikhta|दिखता|appearance|colour|smell/.test(q)) {
    const faq = FAQS[2];
    return {
      text: `${faq.content}\n\nSource: ${faq.title}.`,
      verdict: "caution",
      sources: [{ title: faq.title, detail: "Citizen FAQ" }],
    };
  }

  if (/children|kids|bachch|बच्च|play|khel/.test(q)) {
    const faq = FAQS[3];
    return {
      text: `${faq.content}\n\nSource: ${faq.title}.`,
      verdict: "caution",
      sources: [{ title: faq.title, detail: "Citizen FAQ" }],
    };
  }

  if (st) return stationAnswer(st, q, lang);

  if (/latest|new report|which month|data freshness|advisory|ताज़ा|नई रिपोर्ट|महीन/.test(q)) {
    return {
      text:
        lang === "hinglish"
          ? `Is static demo mein latest illustrative advisory ${latestMonth} ki hai. Stations: ${STATIONS.map((s) => s.short).join(", ")}.\n\nNewest official report ke liye UPPCB publication check karein.`
          : `This static demo uses an illustrative advisory dated ${latestMonth}. Covered stations: ${STATIONS.map((s) => s.short).join(", ")}.\n\nFor the newest official report, check the latest UPPCB publication.`,
      verdict: "info",
      monthLabel: latestMonth,
      sources: [{ title: "Gomti Saathi demo data", detail: latestMonth }],
    };
  }

  return {
    text:
      lang === "hinglish"
        ? "Main Gomti Saathi hoon. Gaughat, Nishatganj, Category E, foam, rain ya bathing ke baare mein poochhein."
        : lang === "hi"
          ? "मैं गोमती साथी हूँ। गौघाट, निशातगंज, श्रेणी E, झाग, बारिश या स्नान के बारे में पूछें।"
          : "I’m Gomti Saathi. Ask about Gaughat, Nishatganj, Category E, foam, rain or bathing.",
    verdict: "info",
    sources: [{ title: "Gomti Saathi client-side knowledge base" }],
  };
}
