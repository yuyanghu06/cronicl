import type { CharacterBibleEntry } from '../db/schema';

/**
 * Match extracted character names against the character bible.
 * Case-insensitive match against `name` and all `aliases`.
 * Deduplicated — returns at most one match per bible entry.
 */
export function matchCharacters(
  extractedNames: string[],
  bible: CharacterBibleEntry[]
): CharacterBibleEntry[] {
  if (extractedNames.length === 0 || bible.length === 0) return [];

  const matched = new Set<string>(); // bible entry IDs already matched
  const results: CharacterBibleEntry[] = [];

  for (const name of extractedNames) {
    const lower = name.toLowerCase().trim();
    if (!lower) continue;

    for (const entry of bible) {
      if (matched.has(entry.id)) continue;

      const nameMatch = entry.name.toLowerCase().trim() === lower;
      const aliasMatch = entry.aliases?.some(
        (alias) => alias.toLowerCase().trim() === lower
      );

      if (nameMatch || aliasMatch) {
        matched.add(entry.id);
        results.push(entry);
        break;
      }
    }
  }

  return results;
}
