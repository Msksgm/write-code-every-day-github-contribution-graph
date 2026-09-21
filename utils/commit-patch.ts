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

export type CommitPatchHeader = {
  sha: string;
  authorDate: string;
};

export const parseCommitPatchHeader = (
  patch: string,
): CommitPatchHeader | null => {
  const header = patch.split(/\r?\n\r?\n/)[0];
  const lines = header?.split(/\r?\n/);
  if (lines == null) {
    return null
  }

  let sha: string | null = null;
  const shaMatch = lines[0]?.match(/^From ([0-9a-fA-F]{40}) /);
  if (shaMatch != null && shaMatch[1] !== undefined) {
    sha = shaMatch[1]?.trim();
  }
  let authorDate: string | null = null;
  for (const line of lines) {
    const lineMatch = line.match(/^Date:\s*(.+)$/);
    if (lineMatch != null && lineMatch[1] !== undefined) {
      const tmp = lineMatch[1]?.trim();
      if (tmp !== '') {
        authorDate = tmp
      }
    }
    if (authorDate !== null && sha !== null) {
      return { authorDate, sha };
    }
  }
  return null
};

