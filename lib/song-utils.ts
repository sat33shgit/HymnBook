import slugify from "slugify";

type TranslationLike = {
  languageCode: string;
  title: string;
  lyrics?: string | null;
};

function getUsableTranslations<T extends TranslationLike>(translations: T[]) {
  return translations.filter(
    (translation) =>
      translation.languageCode.trim().length > 0 &&
      translation.title.trim().length > 0
  );
}

function createStableHash(input: string) {
  let hash = 5381;

  for (const character of input) {
    hash = ((hash * 33) ^ character.codePointAt(0)!) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function deriveSongDefaultLanguage<T extends TranslationLike>(
  translations: T[]
) {
  const usableTranslations = getUsableTranslations(translations);

  return (
    usableTranslations.find((translation) => translation.languageCode === "en")
      ?.languageCode ??
    usableTranslations[0]?.languageCode ??
    "en"
  );
}

export function deriveSongPrimaryTitle<T extends TranslationLike>(
  translations: T[],
  defaultLanguageCode?: string | null
) {
  const usableTranslations = getUsableTranslations(translations);

  if (usableTranslations.length === 0) {
    return "";
  }

  const resolvedDefaultLanguage =
    defaultLanguageCode ?? deriveSongDefaultLanguage(usableTranslations);

  return (
    usableTranslations.find((translation) => translation.languageCode === "en")
      ?.title.trim() ??
    usableTranslations.find(
      (translation) => translation.languageCode === resolvedDefaultLanguage
    )?.title.trim() ??
    usableTranslations[0]?.title.trim() ??
    ""
  );
}

export function deriveSongDisplayTitle<T extends TranslationLike>(
  translations: T[],
  options: {
    preferredLanguageCode?: string | null;
    defaultLanguageCode?: string | null;
  } = {}
) {
  const usableTranslations = getUsableTranslations(translations);

  if (usableTranslations.length === 0) {
    return "";
  }

  const preferredLanguageTitle = options.preferredLanguageCode
    ? usableTranslations.find(
        (translation) =>
          translation.languageCode === options.preferredLanguageCode
      )?.title.trim()
    : null;

  return (
    preferredLanguageTitle ??
    deriveSongPrimaryTitle(usableTranslations, options.defaultLanguageCode)
  );
}

export function deriveSongSlug<T extends TranslationLike>(
  translations: T[],
  options: {
    defaultLanguageCode?: string | null;
    existingSlug?: string | null;
  } = {}
) {
  const usableTranslations = getUsableTranslations(translations);
  const resolvedDefaultLanguage =
    options.defaultLanguageCode ?? deriveSongDefaultLanguage(usableTranslations);
  const primaryTitle = deriveSongPrimaryTitle(
    usableTranslations,
    resolvedDefaultLanguage
  );
  const slug = slugify(primaryTitle, { lower: true, strict: true }).trim();

  if (slug.length > 0) {
    return slug;
  }

  if (options.existingSlug?.trim()) {
    return options.existingSlug.trim();
  }

  const identitySource = usableTranslations
    .map(
      (translation) =>
        `${translation.languageCode}:${translation.title.trim()}:${
          translation.lyrics?.trim().slice(0, 120) ?? ""
        }`
    )
    .join("|");
  const fallbackHash = createStableHash(
    identitySource || resolvedDefaultLanguage || "song"
  );

  return `song-${resolvedDefaultLanguage.toLowerCase()}-${fallbackHash}`;
}
