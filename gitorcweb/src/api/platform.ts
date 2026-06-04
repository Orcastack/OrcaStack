import { requestGateway } from './client';
import type { CreateRepositoryInput, ImportRepositoryInput, Overview, RepositoryMutationResult } from './types';

export async function fetchOverview(signal?: AbortSignal, token?: string | null): Promise<Overview> {
  return requestGateway<Overview>('/api/overview', { signal, token });
}

export async function createRepository(input: CreateRepositoryInput, token?: string | null): Promise<RepositoryMutationResult> {
  return requestGateway<RepositoryMutationResult>('/api/repositories', {
    token,
    method: 'POST',
    body: {
      name: input.name,
      summary: input.summary,
      default_branch: input.defaultBranch,
    },
  });
}

export async function importRepository(input: ImportRepositoryInput, token?: string | null): Promise<RepositoryMutationResult> {
  return requestGateway<RepositoryMutationResult>('/api/repositories/import', {
    token,
    method: 'POST',
    body: {
      name: input.name,
      summary: input.summary,
      default_branch: input.defaultBranch,
      source_url: input.sourceUrl,
    },
  });
}
