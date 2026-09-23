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


// SHA と日時が両方一致するかを返す
export const matchesCommitPatchHeader = (
  header: CommitPatchHeader,
  expectedSha: string,
  apiAuthorDate: string,
): boolean => {
  if (header.sha.toLowerCase() !== expectedSha.toLowerCase()) {
    return false;
  }

  const patchTime = Date.parse(header.authorDate);
  const apiTime = Date.parse(apiAuthorDate);

  if (Number.isNaN(patchTime) || Number.isNaN(apiTime)) {
    return false;
  }

  if (patchTime !== apiTime) {
    return false;
  }

  return true;
}

export const extractCommitAuthorDate = (
  authorDate: string,
): string | null => {
  if (Number.isNaN(Date.parse(authorDate))) {
    return null
  }
  // 年月日を取り出す。形式が不正なら null
  const match = authorDate.match(
    /^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s/,
  )

  if (match === null) {
    return null;
  }

  const months = new Map<string, string>([
    ['Jan', '01'],
    ['Feb', '02'],
    ['Mar', '03'],
    ['Apr', '04'],
    ['May', '05'],
    ['Jun', '06'],
    ['Jul', '07'],
    ['Aug', '08'],
    ['Sep', '09'],
    ['Oct', '10'],
    ['Nov', '11'],
    ['Dec', '12'],
  ]);
  if (match[2] == undefined) {
    return null;
  }
  const month = months.get(match[2]);
  if (month === undefined) {
    return null;
  }

  const year = match[3];
  if (year === undefined) {
    return null;
  }

  if (match[1] === undefined) {
    return null;
  }
  const day = match[1].padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const resolveCommitDate = (
  patch: string,
  expectedSha: string,
  apiAuthorDate: string,
): string | null => {

  const commitPatchHeader = parseCommitPatchHeader(patch);

  if (commitPatchHeader === null) {
    return null;
  }

  if (!matchesCommitPatchHeader(commitPatchHeader, expectedSha, apiAuthorDate)) {
    return null;
  }

  return extractCommitAuthorDate(commitPatchHeader.authorDate);
}
