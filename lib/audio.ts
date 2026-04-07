export const MAX_AUDIO_SIZE_MB = 10;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;

export const AUDIO_SIZE_ERROR_MESSAGE =
  `Audio file is too large. Please upload an audio file of ${MAX_AUDIO_SIZE_MB} MB or less.`;
