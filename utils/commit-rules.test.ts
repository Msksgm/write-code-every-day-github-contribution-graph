import { describe, expect, it } from 'vitest';
import { isMergeCommit, hasCodeChanges, isTargetAuthor } from './commit-rules';

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

describe('hasCodeChanges', () => {
  it('すべて許可リストに含まれているならtrue', () => {

    const files = [{ filename: 'src/Main.kt' }]
    const allowedExtensions = ['.kt', '.ts']

    expect(hasCodeChanges(files, allowedExtensions)).toBe(true)
  })

  it('許可リストに1件でも含まれるならtrue', () => {

    const files = [{ filename: 'README.md' }, { filename: 'src/Main.kt' }]
    const allowedExtensions = ['.kt', '.ts']

    expect(hasCodeChanges(files, allowedExtensions)).toBe(true)
  })

  it('許可リストに1件も含まれない', () => {

    const files = [{ filename: 'README.md' }, { filename: 'config.yaml' }, { filename: 'package.json' }]
    const allowedExtensions = ['.kt', '.ts']

    expect(hasCodeChanges(files, allowedExtensions)).toBe(false)
  })

  it('filesが空ならfalse', () => {

    const files: { filename: string }[] = []
    const allowedExtensions = ['.kt', '.ts']

    expect(hasCodeChanges(files, allowedExtensions)).toBe(false)
  })

  it('拡張子が異なれば、途中で含まれていてもfalse', () => {

    const files = [{ filename: 'src/Main.kt.bak' }]
    const allowedExtensions = ['.kt', '.ts']

    expect(hasCodeChanges(files, allowedExtensions)).toBe(false)
  })

  it('allowListが空ならばfalse', () => {

    const files = [{ filename: 'src/Main.kt' }]
    const allowedExtensions: string[] = []

    expect(hasCodeChanges(files, allowedExtensions)).toBe(false)
  })
})

describe('isTargetAuthor', () => {
  it('authorと対象ユーザーが完全一致のときtrue', () => {
    const author = { login: 'Msksgm' }
    const targetUser = 'Msksgm'

    expect(isTargetAuthor(author, targetUser)).toBe(true)
  })

  it('authorと対象ユーザーが小文字どちらかが小文字でもtrue', () => {
    const author = { login: 'Msksgm' }
    const targetUser = 'msksgm'

    expect(isTargetAuthor(author, targetUser)).toBe(true)
  })

  it('authorと対象ユーザーが一致しないときfalse', () => {
    const author = { login: 'Msksgm' }
    const targetUser = 'someone-else'

    expect(isTargetAuthor(author, targetUser)).toBe(false)
  })

  it('authorとnullのときfalse', () => {
    const author = null
    const targetUser = 'Msksgm'

    expect(isTargetAuthor(author, targetUser)).toBe(false)
  })
})
