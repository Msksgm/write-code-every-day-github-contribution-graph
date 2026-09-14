import { isMergeCommit, hasCodeChanges } from "@/utils/commit-rules";

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


  await fetchCommits(repository.full_name, headSha, 'Msksgm');
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
): Promise<void> => {
  const params = new URLSearchParams({
    sha: headSha,
    author,
    per_page: '10',
    page: '1',
  })
  const response = await fetch(`https://api.github.com/repos/${fullName}/commits?${params}`)

  if (!response.ok) {
    throw new Error(`取得に失敗しました : HTTP ${response.status}`)
  }

  const commits = await response.json();

  console.log({ commits })

  if (commits.length == 0) {
    return
  }

  for (const commit of commits) {
    await fetchCommitFiles(fullName, commit.sha)
  }
};

const fetchCommitFiles = async (
  fullName: string,
  sha: string,
): Promise<void> => {
  const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${sha}`)

  if (!response.ok) {
    throw new Error(`取得に失敗しました : HTTP ${response.status}`)
  }

  const commit = await response.json();

  if (isMergeCommit(commit.parents)) {
    console.log('merge commit を除外:', commit.sha);
    return
  }

  const allowedExtensions = [`.kt`, `.kts`, `.java`, `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.rs`, `.rb`, `.php`, `.c`, `.h`, `.cpp`, `.hpp`, `.cs`, `.swift`, `.dart`, `.scala`, `.sh`, `.sql`]
  const includeCode = hasCodeChanges(commit.files, allowedExtensions)
  console.log({ sha: commit.sha, includeCode })
};

