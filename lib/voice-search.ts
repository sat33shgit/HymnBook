export interface VoiceSearchResultCandidate {
  title: string;
  matched_text: string;
  matched_language: string;
  category: string | null;
}

export interface VoiceSearchResolution {
  resolvedQuery: string;
  suggestion: string | null;
  isUncertain: boolean;
}

function normalizeVoiceText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordOverlapScore(input: string, target: string) {
  const inputWords = new Set(normalizeVoiceText(input).split(" ").filter(Boolean));
  const targetWords = new Set(normalizeVoiceText(target).split(" ").filter(Boolean));

  let overlap = 0;
  inputWords.forEach((word) => {
    if (targetWords.has(word)) {
      overlap += 1;
    }
  });

  return overlap;
}

function scoreCandidate(candidate: string, results: VoiceSearchResultCandidate[]) {
  if (results.length === 0) {
    return -1;
  }

  const normalizedCandidate = normalizeVoiceText(candidate);
  const bestTitleMatch = results.slice(0, 5).reduce((bestScore, result) => {
    const normalizedTitle = normalizeVoiceText(result.title);

    if (normalizedTitle === normalizedCandidate) {
      return Math.max(bestScore, 120);
    }

    if (normalizedTitle.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTitle)) {
      return Math.max(bestScore, 80);
    }

    return Math.max(bestScore, getWordOverlapScore(candidate, result.title) * 20);
  }, 0);

  return results.length * 25 + bestTitleMatch;
}

function getSuggestion(candidate: string, results: VoiceSearchResultCandidate[]) {
  const topResult = results[0]?.title?.trim();

  if (!topResult) {
    return null;
  }

  if (normalizeVoiceText(topResult) === normalizeVoiceText(candidate)) {
    return null;
  }

  if (getWordOverlapScore(candidate, topResult) === 0) {
    return null;
  }

  return topResult;
}

export async function resolveVoiceSearchQuery(
  candidates: string[],
  search: (query: string) => Promise<VoiceSearchResultCandidate[]>
): Promise<VoiceSearchResolution> {
  const uniqueCandidates = candidates
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .filter((candidate, index, all) => all.indexOf(candidate) === index)
    .slice(0, 5);

  if (uniqueCandidates.length === 0) {
    return {
      resolvedQuery: "",
      suggestion: null,
      isUncertain: false,
    };
  }

  if (uniqueCandidates.length === 1) {
    return {
      resolvedQuery: uniqueCandidates[0],
      suggestion: null,
      isUncertain: false,
    };
  }

  const evaluations = await Promise.all(
    uniqueCandidates.map(async (candidate) => {
      try {
        const results = await search(candidate);
        return {
          candidate,
          score: scoreCandidate(candidate, results),
          results,
        };
      } catch {
        return {
          candidate,
          score: -1,
          results: [],
        };
      }
    })
  );

  evaluations.sort((left, right) => right.score - left.score);

  const best = evaluations[0];
  const nextBest = evaluations[1];
  const resolvedQuery = best?.candidate ?? uniqueCandidates[0];
  const suggestion = best ? getSuggestion(best.candidate, best.results) : null;
  const closeScore = best && nextBest ? best.score - nextBest.score < 25 : false;
  const weakScore = (best?.score ?? -1) < 90;

  return {
    resolvedQuery,
    suggestion,
    isUncertain: Boolean(suggestion) && (closeScore || weakScore),
  };
}