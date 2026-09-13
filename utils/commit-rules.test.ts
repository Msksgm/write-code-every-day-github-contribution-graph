import { describe, expect, it } from 'vitest';
import { isMergeCommit } from './commit-rules';

describe('isMergeCommit', () => {
  it('親が0件の通常コミットはMergeではない', () => {
    const parents: { sha: string }[] = []

    expect(isMergeCommit(parents)).toBe(false)
  })

  it('親が1件の通常コミットはMergeではない', () => {
    const parents = [{ sha: 'parent-a' }]

    expect(isMergeCommit(parents)).toBe(false)
  })

  it('親が2件のコミットはMergeである', () => {
    const parents = [
      { sha: 'parent-a' },
      { sha: 'parent-b' },
    ];

    expect(isMergeCommit(parents)).toBe(true)
  })

  it('親が3件のコミットはMergeである', () => {
    const parents = [
      { sha: 'parent-a' },
      { sha: 'parent-b' },
      { sha: 'parent-c' },
    ];

    expect(isMergeCommit(parents)).toBe(true)
  })
})
