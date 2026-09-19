import { fetchCommitFiles, type CommitCheckResult } from "@/utils/commit-files";
import { fetchCommitPatch } from "@/utils/commit-patch";
import { isTargetAuthor } from "@/utils/commit-rules";

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  fetchRepository().catch((error) => {
    console.error('リポジトリの取得エラー:', error);
  })
});

const fetchRepository = async (): Promise<void> => {
  const response = await fetch('https://api.github.com/repos/Msksgm/write-code-every-day-github-contribution-graph');

  if (!response.ok) {
    throw new Error(`取得に失敗しました : HTTP ${response.status}`);
  }

  const repository = await response.json();

  const headSha = await fetchHeadSha(
    repository.full_name,
    repository.default_branch,
  );

  const patch = await fetchCommitPatch(repository.full_name, headSha);
  console.log(patch);

  const results = await fetchCommits(repository.full_name, headSha, 'Msksgm');
  console.table(results)
};

const fetchHeadSha = async (
  fullName: string,
  branch: string,
): Promise<string> => {
  const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${encodeURIComponent(branch)}`)

  if (!response.ok) {
    throw new Error(`取得に失敗しました : HTTP ${response.status}`)
  }

  const commit = await response.json();


  return commit.sha
};

const fetchCommits = async (
  fullName: string,
  headSha: string,
  author: string,
): Promise<CommitCheckResult[]> => {
  let page = 1
  const results: CommitCheckResult[] = [];
  while (true) {
    const params = new URLSearchParams({
      sha: headSha,
      author,
      per_page: '10',
      page: page.toString(),
    })
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits?${params}`)
    if (!response.ok) {
      throw new Error(`取得に失敗しました : HTTP ${response.status}`)
    }

    const commits = await response.json();

    if (commits.length == 0) {
      return results
    }

    for (const commit of commits) {
      if (!isTargetAuthor(commit.author, author)) {
        results.push({ sha: commit.sha, status: 'excluded' })
        continue
      }
      const result = await fetchCommitFiles(fullName, commit.sha)
      results.push(result)
    }
    const link = response.headers.get('link');
    const hasNextPage = link?.includes('rel="next"') ?? false;
    console.log({ page, count: commits.length })
    if (!hasNextPage) {
      break
    }
    page += 1
  }
  return results
};

