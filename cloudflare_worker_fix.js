// ==============================================================================
// Verslomatika Edge Worker Pataisa (/r/:slug maršrutui)
// Vieta: Cloudflare Dashboard -> Workers & Pages -> verslomatika -> Edit Code
// ==============================================================================

// 1. Žinomi patikrinti įmonių Google Place ID:
const KNOWN_PLACE_IDS = {
  "baldu-turgus": "ChIJdRDmwEGV3UYRnKIblCzu0as", // Baldų turgus Vilnius (Sodybų g. 30) - Tiesioginis 5★ modalas
  "vilniaus-denta": "ChIJb_f1oHmb3UYRuD_m0q6b7mU",
  "memocasting": "ChIJ2765w1qX3UYR1086_8N5g-g"
};

// 2. Suraskite eilutę, kur aprašytas googleUrl (apie /r/:slug funkciją):
// SENAS KODAS (kuris atidarydavo bendrą žemėlapio paiešką):
// const googleUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(bName + " Lietuva");

// PAKEISKITE Į ŠĮ NAUJĄ KODĄ:
const customReviewUrl = url.searchParams.get("to") || url.searchParams.get("target") || url.searchParams.get("review_url");
const googleUrl = customReviewUrl || (KNOWN_PLACE_IDS[slug] 
  ? `https://search.google.com/local/writereview?placeid=${KNOWN_PLACE_IDS[slug]}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bName + " Lietuva")}`);
