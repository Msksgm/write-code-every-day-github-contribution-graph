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

  console.log({
    full_name: repository.full_name,
    private: repository.private,
    default_branch: repository.default_branch,
  });
};
