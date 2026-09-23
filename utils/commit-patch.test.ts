import { describe, expect, it } from 'vitest';
import { parseCommitPatchHeader, matchesCommitPatchHeader, extractCommitAuthorDate, resolveCommitDate } from './commit-patch';

describe('parseCommitPatchHeader', () => {
  it('先頭のSHAとDateヘッダーを抽出する', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\nDate: ${authorDate}\n\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toStrictEqual({ sha: sha, authorDate: authorDate });
  })

  it('本文中のDate:を拾わずにヘッダーにないときにはnull', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\nSubject: example\n\nDate: ${authorDate}`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })

  it('負のオフセット', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 -0700';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\nDate: ${authorDate}\n\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toStrictEqual({ sha: sha, authorDate: authorDate });
  })

  it('Windows 形式の改行', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\r\nDate: ${authorDate}\r\n\r\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toStrictEqual({ sha: sha, authorDate: authorDate });
  })

  it('SHAがないときnull', () => {
    const sha = ''
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\r\nDate: ${authorDate}\r\n\r\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })

  it('SHAが39のときnull', () => {
    const sha = 'a'.repeat(39);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\r\nDate: ${authorDate}\r\n\r\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })

  it('Dateがないときnull', () => {
    const sha = 'a'.repeat(40);
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\r\n\r\n\r\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })

  it('Dateが空白のときnull', () => {
    const sha = 'a'.repeat(40);
    const authorDate = '                               ';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\r\nDate: ${authorDate}\r\n\r\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })

  it('正しいshaが先頭にない', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `Mon Sep 17 00:00:00 2001\nFrom ${sha} \nDate: ${authorDate}\n\n本文`;

    const commitPatchHeader = parseCommitPatchHeader(patch);

    expect(commitPatchHeader).toBeNull();
  })
})

describe('matchesCommitPatchHeader', () => {
  it('SHA が一致し、+0900 と UTC が同じ瞬間', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const header = { sha: sha, authorDate: authorDate };
    const expectedSha = sha;
    const apiAuthorDate = '2026-09-19T00:05:46Z';

    const isMatch = matchesCommitPatchHeader(header, expectedSha, apiAuthorDate);
    expect(isMatch).toBe(true)
  })

  it('SHA が一致し、-0700 と UTC が同じ瞬間', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 -0700';
    const header = { sha: sha, authorDate: authorDate };
    const expectedSha = sha;
    const apiAuthorDate = '2026-09-19T16:05:46Z';

    const isMatch = matchesCommitPatchHeader(header, expectedSha, apiAuthorDate);
    expect(isMatch).toBe(true)
  })

  it('SHA が異なる', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const header = { sha: sha, authorDate: authorDate };
    const expectedSha = 'b'.repeat(40);
    const apiAuthorDate = '2026-09-19T00:05:46Z';

    const isMatch = matchesCommitPatchHeader(header, expectedSha, apiAuthorDate);
    expect(isMatch).toBe(false);
  })

  it('日時が1秒異なる', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const header = { sha: sha, authorDate: authorDate };
    const expectedSha = sha;
    const apiAuthorDate = '2026-09-19T00:05:45Z';

    const isMatch = matchesCommitPatchHeader(header, expectedSha, apiAuthorDate);
    expect(isMatch).toBe(false)
  })

  it('日時が解析できない文字列', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const header = { sha: sha, authorDate: authorDate };
    const expectedSha = sha;
    const apiAuthorDate = 'not-a-date';

    const isMatch = matchesCommitPatchHeader(header, expectedSha, apiAuthorDate);
    expect(isMatch).toBe(false);
  })
})

describe('extractCommitAuthorDate', () => {
  it('正のオフセットでUTCでは前日になる場合も元の日付を返す', () => {
    const authorDate = 'Sat, 19 Sep 2026 00:30:00 +0900';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBe('2026-09-19');
  })

  it('負のオフセットでUTCでは翌日になる場合も元の日付を返す', () => {
    const authorDate = 'Sat, 19 Sep 2026 23:30:00 -0700';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBe('2026-09-19');
  })

  it('1桁の日をゼロ埋めしてYYYY-MM-DD形式で返す', () => {
    const authorDate = 'Tue, 1 Sep 2026 09:00:00 +0900';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBe('2026-09-01');
  })

  it('解析できない日時の場合はnullを返す', () => {
    const authorDate = 'not-a-date';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBeNull();
  })

  it('空文字の場合はnullを返す', () => {
    const authorDate = '';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBeNull();
  })

  it('年月日があっても時刻部分が不正ならnullを返す', () => {
    const authorDate = 'Sat, 19 Sep 2026 invalid';
    const extractedCommitAuthorDate = extractCommitAuthorDate(authorDate)

    expect(extractedCommitAuthorDate).toBeNull();
  })

})

describe('resolveCommitDate', () => {
  it('一致する patch のとき、日付を探す', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\nDate: ${authorDate}\n\n本文`;

    const actual = resolveCommitDate(patch, sha, authorDate);

    expect(actual).toEqual('2026-09-19');
  })

  it('日付は抽出できるが SHA が不一致の patch → null', () => {
    const sha = 'a'.repeat(40);
    const authorDate = 'Sat, 19 Sep 2026 09:05:46 +0900';
    const invalidSha = 'b'.repeat(40);
    const patch = `From ${sha} Mon Sep 17 00:00:00 2001\nDate: ${authorDate}\n\n本文`;

    const actual = resolveCommitDate(patch, invalidSha, authorDate);

    expect(actual).toBeNull();
  })
})
