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

  // Tokenize query and remove common stopwords (Spanish + English)
  const STOPWORDS = new Set([
    'de', 'del', 'la', 'el', 'las', 'los', 'y', 'en', 'a', 'por', 'para', 'con', 'sin', 'que',
    'the', 'of', 'and', 'in', 'on', 'for', 'to', 'from', 'by', 'at', 'is', 'are',
  ]);

  const tokens = normalizedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t));

  // If all tokens were stopwords (e.g., user typed "de la"), fall back to full-query search
  if (tokens.length === 0) {
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

  return items.filter((item) => {
    // Build a single searchable string from all configured fields so tokens
    // can match across field boundaries and in any order.
    const combinedParts: string[] = [];
    for (const field of config.searchFields) {
      const value = getNestedValue(item, field);
      if (value == null) continue;
      if (Array.isArray(value)) {
        combinedParts.push(value.join(' '));
      } else if (typeof value === 'object') {
        // attempt JSON stringify for objects
        try {
          combinedParts.push(JSON.stringify(value));
        } catch (e) {
          // ignore
        }
      } else {
        combinedParts.push(String(value));
      }
    }

    if (combinedParts.length === 0) return false;

    const combined = normalizeText(combinedParts.join(' '));

    // All tokens must be present (order-independent). Use simple substring
    // match which allows partials like "1ra" matching "1ra iglesia".
    return tokens.every((token) => combined.includes(token));
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
