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

  console.log({ headSha });
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
