const STORAGE_KEYS = {
  NOTES: 'SILICEO_NOTES_DATA',
  NOTES_LINKS: 'SILICEO_NOTES_LINKS',
  RESEARCH: 'SILICEO_RESEARCH_HISTORY',
  CHINESE: 'SILICEO_CHINESE_WORDS',
  HISTORY_BUDDY_BG: 'history_buddy_bg',
  LECTURE_LENS_DARK_MODE: 'LECTURE_LENS_DARK_MODE',
  LECTURE_LENS_HISTORY: 'LECTURE_LENS_HISTORY',
};

export const storage = {
  get: <T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): T => {
    const saved = localStorage.getItem(STORAGE_KEYS[key]);
    return saved ? JSON.parse(saved) : defaultValue;
  },
  set: <T>(key: keyof typeof STORAGE_KEYS, value: T): void => {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  },
};
