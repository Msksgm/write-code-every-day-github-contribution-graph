import { isMergeCommit, hasCodeChanges } from './commit-rules';
import { githubFetch } from "./github-fetch";

export const fetchCommitFiles = async (
  fullName: string,
  sha: string,
): Promise<CommitCheckResult> => {
  const allowedExtensions = [`.kt`, `.kts`, `.java`, `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.rs`, `.rb`, `.php`, `.c`, `.h`, `.cpp`, `.hpp`, `.cs`, `.swift`, `.dart`, `.scala`, `.sh`, `.sql`];
  let page = 1;
  let fetchFileCount = 0;
  while (true) {
    const params = new URLSearchParams({
      per_page: '10',
      page: page.toString(),
    })
    const response = await githubFetch(`/repos/${fullName}/commits/${sha}?${params}`);

    if (!response.ok) {
      throw new Error(`取得に失敗しました : HTTP ${response.status}`)
    }

    const commit = await response.json();
    fetchFileCount += commit.files.length;

    if (isMergeCommit(commit.parents)) {
      console.log('merge commit を除外:', commit.sha);
      return { sha: commit.sha, status: 'excluded' };
    }

    const includeCode = hasCodeChanges(commit.files, allowedExtensions)
    if (includeCode) {
      return { sha: commit.sha, status: 'included' };
    }

    if (fetchFileCount >= 3000) {
      return { sha: commit.sha, status: 'unknown' };
    }

    const link = response.headers.get('link');
    const hasNextPage = link?.includes('rel="next"') ?? false;
    if (!hasNextPage) {
      return { sha: commit.sha, status: 'excluded' }
    }
    page += 1
  }
};


export type CommitCheckResult = {
  sha: string;
  status: 'included' | 'excluded' | 'unknown';
};
