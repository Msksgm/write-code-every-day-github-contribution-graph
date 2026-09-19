export const fetchCommitPatch = async (
  fullName: string,
  sha: string,
): Promise<string> => {
  const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${sha}`,
    {
      headers: {
        Accept: 'application/vnd.github.patch',
      },
    },
  );
  if (!response.ok) {
    throw new Error(`取得に失敗しました : HTTP ${response.status}`)
  }

  const patch = await response.text();
  return patch;
};
