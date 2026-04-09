/**
 * Search utilities for normalized, accent-insensitive searching
 * Handles search across multiple fields with highlighting support
 */

/**
 * Normalize text: remove accents, convert to lowercase, trim whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Search configuration for different entity types
 */
export interface SearchConfig {
  searchFields: string[];
  displayFields: string[];
}

/**
 * High-level search function
 */
export function searchItems<T extends Record<string, any>>(
  items: T[],
  query: string,
  config: SearchConfig,
): T[] {
  if (!query.trim()) return items;

  const normalizedQuery = normalizeText(query);

  return items.filter((item) => {
    return config.searchFields.some((field) => {
      const value = getNestedValue(item, field);
      if (value == null) return false;
      
      const valueStr = Array.isArray(value) ? value.join(' ') : String(value);
      if (!valueStr) return false;

      const normalizedValue = normalizeText(valueStr);
      return normalizedValue.includes(normalizedQuery);
    });
  });
}

/**
 * Get highlighted text for display (adds yellow highlights)
 */
export function highlightText(
  text: string,
  query: string,
): Array<{ text: string; isMatch: boolean }> {
  if (!query.trim()) return [{ text, isMatch: false }];

  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);

  // Find all occurrences
  const parts: Array<{ text: string; isMatch: boolean }> = [];
  let lastIndex = 0;
  let index = normalizedText.indexOf(normalizedQuery);

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, index),
        isMatch: false,
      });
    }

    // Add match
    parts.push({
      text: text.substring(index, index + query.length),
      isMatch: true,
    });

    lastIndex = index + query.length;
    index = normalizedText.indexOf(normalizedQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isMatch: false,
    });
  }

  return parts;
}

/**
 * Get value from nested object path (e.g., "person.address.city")
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => {
    if (current == null) return current;
    if (Array.isArray(current)) {
      const mapped = current.map((item) => item?.[prop]).filter((v) => v != null);
      // Flatten the array by one level
      return mapped.reduce((acc: any[], val) => acc.concat(val), []);
    }
    return current[prop];
  }, obj);
}

/**
 * Predefined search configs for different entity types
 */
export const SEARCH_CONFIGS = {
  templos: {
    searchFields: ['temploName', 'address', 'pastores.fullName', 'coros.coroName', 'coros.presidentName'],
    displayFields: ['temploName'],
  } as SearchConfig,

  pastores: {
    searchFields: ['fullName', 'temploName', 'phone'],
    displayFields: ['fullName', 'temploName'],
  } as SearchConfig,

  coros: {
    searchFields: ['coroName', 'presidentName', 'presidentPhone', 'temploName'],
    displayFields: ['coroName', 'presidentName'],
  } as SearchConfig,

  directiva: {
    searchFields: ['fullName', 'role', 'temploName', 'phone'],
    displayFields: ['fullName', 'role'],
  } as SearchConfig,
};
