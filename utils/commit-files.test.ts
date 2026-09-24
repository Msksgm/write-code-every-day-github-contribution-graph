import { afterEach, expect, it, vi } from 'vitest';
import { fetchCommitFiles } from './commit-files';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
})

it('1ページ目にコードがあれば次ページを取得しない', async () => {
  const response = new Response(
    JSON.stringify({
      sha: 'commit-a',
      parents: [{ sha: 'parente-a' }],
      files: [{ filename: 'src/main.ts' }],
    }),
    {
      status: 200,
      headers: {
        link: '<https://api.github.com/repos/owner/repo/commits/commit-a?page=2>; rel="next"',
      }
    }
  )

  const fetchMock = vi.fn().mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchMock)

  const result = await fetchCommitFiles('owner/repo', 'commit-a');

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(result).toEqual({
    sha: 'commit-a',
    status: 'included'
  })
})

it('2ページ目にだけコードがあるとき、2ページまで確認して次を確認しない', async () => {
  const response1 = new Response(
    JSON.stringify({
      sha: 'commit-a',
      parents: [{ sha: 'parente-a' }],
      files: [{ filename: 'README.md' }],
    }),
    {
      status: 200,
      headers: {
        link: '<https://api.github.com/repos/owner/repo/commits/commit-a?page=2>; rel="next"',
      }
    }
  )
  const response2 = new Response(
    JSON.stringify({
      sha: 'commit-a',
      parents: [{ sha: 'parente-a' }],
      files: [{ filename: 'src/main.ts' }],
    }),
    {
      status: 200,
      headers: {
        link: '<https://api.github.com/repos/owner/repo/commits/commit-a?page=3>; rel="next"',
      }
    }
  )

  const fetchMock = vi.fn().mockResolvedValueOnce(response1).mockResolvedValueOnce(response2);
  vi.stubGlobal('fetch', fetchMock)

  const result = await fetchCommitFiles('owner/repo', 'commit-a');

  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'https://api.github.com/repos/owner/repo/commits/commit-a?per_page=10&page=2',
    expect.objectContaining({
      headers: expect.any(Headers),
    }),
  )
  expect(result).toEqual({
    sha: 'commit-a',
    status: 'included'
  })
})

it('「全ページが文書だけならexcludedを返す', async () => {
  const response1 = new Response(
    JSON.stringify({
      sha: 'commit-a',
      parents: [{ sha: 'parente-a' }],
      files: [{ filename: 'README.md' }],
    }),
    {
      status: 200,
      headers: {
        link: '<https://api.github.com/repos/owner/repo/commits/commit-a?page=2>; rel="next"',
      }
    }
  )
  const response2 = new Response(
    JSON.stringify({
      sha: 'commit-a',
      parents: [{ sha: 'parente-a' }],
      files: [{ filename: 'docs/guide.md' }],
    }),
    {
      status: 200,
      headers: {
        link: '<https://api.github.com/repos/owner/repo/commits/commit-a?per_page=10&page=1>; rel="prev"',
      }
    }
  )

  const fetchMock = vi.fn().mockResolvedValueOnce(response1).mockResolvedValueOnce(response2);
  vi.stubGlobal('fetch', fetchMock)

  const result = await fetchCommitFiles('owner/repo', 'commit-a');

  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'https://api.github.com/repos/owner/repo/commits/commit-a?per_page=10&page=2',
    expect.objectContaining({
      headers: expect.any(Headers),
    }),
  )
  expect(result).toEqual({
    sha: 'commit-a',
    status: 'excluded'
  })
})

it('コードがなく累計3,000ファイルに到達したら「unknown」を返す', async () => {
  const fetchMock = vi.fn();
  for (let page = 1; page <= 300; page++) {
    const files = Array.from({ length: 10 }, (_, index) => ({
      filename: `docs/page-${page}-file-${index}.md`
    }))

    const response = new Response(
      JSON.stringify({
        sha: 'commit-a',
        parents: [{ sha: 'parent-a' }],
        files,
      }),
      {
        status: 200,
        headers: {
          link: `<https://api.github.com/repos/owner/repo/commits/commit-a?per_page=10&page=${page + 1}>; rel="next"`,
        },
      },
    );

    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal('fetch', fetchMock)

  const result = await fetchCommitFiles('owner/repo', 'commit-a');

  expect(fetchMock).toHaveBeenCalledTimes(300)
  expect(fetchMock).toHaveBeenNthCalledWith(
    300,
    'https://api.github.com/repos/owner/repo/commits/commit-a?per_page=10&page=300',
    expect.objectContaining({
      headers: expect.any(Headers),
    }),
  )
  expect(result).toEqual({
    sha: 'commit-a',
    status: 'unknown'
  })
})
