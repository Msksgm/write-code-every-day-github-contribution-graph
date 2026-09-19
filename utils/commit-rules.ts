
// Merge commit 判定
export const isMergeCommit = (
  parents: { sha: string }[],
): boolean => {
  // 通常 commit は 1 つ、root commit は 0、Merge commit は 2 つ以上になる
  if (parents.length >= 2) {
    return true
  }
  return false
};

// Write Code Every Day 判定に用いられるファイルがある
export const hasCodeChanges = (
  files: { filename: string }[],
  allowedExtensions: string[],
): boolean => {
  for (const file of files) {
    for (const extension of allowedExtensions) {
      if (file.filename.endsWith(extension)) {
        return true
      }
    }
  }
  return false
}

export const isTargetAuthor = (
  author: { login: string } | null,
  targetUser: string,
): boolean => {
  if (author === null) {
    return false
  }

  if (author.login.toLowerCase() !== targetUser.toLowerCase()) {
    return false
  }

  return true
}
