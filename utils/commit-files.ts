import { isMergeCommit, hasCodeChanges } from './commit-rules';

export const fetchCommitFiles = async (
  fullName: string,
  sha: string,
): Promise<void> => {
  const allowedExtensions = [`.kt`, `.kts`, `.java`, `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.rs`, `.rb`, `.php`, `.c`, `.h`, `.cpp`, `.hpp`, `.cs`, `.swift`, `.dart`, `.scala`, `.sh`, `.sql`];
  let page = 1;
  let fetchFileCount = 0;
  while (true) {
    const params = new URLSearchParams({
      per_page: '10',
      page: page.toString(),
    })
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${sha}?${params}`)

    if (!response.ok) {
      throw new Error(`取得に失敗しました : HTTP ${response.status}`)
    }

    const commit = await response.json();
    fetchFileCount += commit.files.length;

    if (isMergeCommit(commit.parents)) {
      console.log('merge commit を除外:', commit.sha);
      return
    }

    const includeCode = hasCodeChanges(commit.files, allowedExtensions)
    if (includeCode) {
      console.log({ sha: commit.sha, includeCode })
      return
    }

    if (fetchFileCount >= 3000) {
      console.log({ sha: commit.sha, status: '未確認' });
      return;
    }

    const link = response.headers.get('link');
    const hasNextPage = link?.includes('rel="next"') ?? false;
    if (!hasNextPage) {
      console.log({ sha: commit.sha, includeCode })
      break
    }
    page += 1
  }
};

