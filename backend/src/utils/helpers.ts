/**
 * Common helper functions for the SEAL-HMS backend.
 */

/**
 * Exclude specified keys from an object.
 * Useful for removing sensitive fields like passwordHash from user objects.
 */
export function excludeFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Parse pagination params from query string with defaults.
 */
export function parsePagination(query: { page?: string; limit?: string }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a paginated response object.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Fetch latest commit SHA from GitHub API for a given repository URL.
 */
export async function getLatestCommitSha(repoUrl: string): Promise<string | null> {
  try {
    const regex = /github\.com\/([^\/]+)\/([^\/.]+)/;
    const match = repoUrl.match(regex);
    if (!match) return null;
    const owner = match[1];
    let repo = match[2];
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }
    
    const headers: Record<string, string> = {
      'User-Agent': 'SEAL-HMS-Backend',
    };
    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, { headers });
    if (!response.ok) {
      console.warn(`GitHub API returned status ${response.status} for ${owner}/${repo}`);
      return null;
    }
    const data: any = await response.json();
    if (Array.isArray(data) && data.length > 0 && data[0].sha) {
      return data[0].sha;
    }
    return null;
  } catch (error) {
    console.error('Failed to get latest commit SHA from GitHub:', error);
    return null;
  }
}
