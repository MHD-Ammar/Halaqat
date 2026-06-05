/**
 * CRUD Hook Factory
 *
 * `createResourceHooks<TEntity>()` generates a set of React Query hooks
 * (useList, useDetail, useCreate, useUpdate, useRemove) for a given REST
 * resource. Eliminates the ~20 near-identical CRUD quintets in the hooks
 * folder.
 *
 * Usage:
 *   const questHooks = createResourceHooks<Quest>({
 *     baseUrl: "/gamification/admin/quests",
 *     keys: queryKeys.adminQuests,
 *   });
 *   export const useAdminQuests = questHooks.useList;
 *   export const useCreateQuest  = questHooks.useCreate;
 *
 * Custom URLs:
 *   If the backend doesn't follow the `<baseUrl>/:id` convention you can
 *   override individual URL builders via the `urls` option.
 *
 * Custom invalidation:
 *   By default mutations invalidate `keys.all`. Override per mutation type
 *   via `invalidateOn.create / update / remove`.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { apiClient } from "@/lib/api-client";

// ── Configuration ──────────────────────────────────────────────────────────

export interface ResourceHooksConfig<TListParams = void> {
  /** REST base path, e.g. "/gamification/admin/quests". */
  baseUrl: string;

  /** Query key slices from the central registry. */
  keys: {
    all: readonly unknown[];
    list: (params?: TListParams) => readonly unknown[];
    detail: (id: string) => readonly unknown[];
  };

  /**
   * Override the default URL patterns.
   * Defaults: GET baseUrl, POST baseUrl, PUT baseUrl/:id, DELETE baseUrl/:id
   */
  urls?: Partial<{
    list: (params?: TListParams) => string;
    detail: (id: string) => string;
    create: () => string;
    update: (id: string) => string;
    remove: (id: string) => string;
  }>;

  /**
   * Which query-key arrays to invalidate after each mutation type.
   * Defaults to `[keys.all]` for create/remove, `[keys.all, keys.detail(id)]`
   * for update.
   */
  invalidateOn?: {
    create?: readonly (readonly unknown[])[];
    update?: readonly (readonly unknown[])[];
    remove?: readonly (readonly unknown[])[];
  };
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createResourceHooks<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
  TListParams = void,
>(config: ResourceHooksConfig<TListParams>) {
  const { baseUrl, keys, urls, invalidateOn } = config;

  // ── useList ──────────────────────────────────────────────────────────

  function useList(
    params?: TListParams,
    options?: Omit<UseQueryOptions<TEntity[]>, "queryKey" | "queryFn">,
  ) {
    return useQuery<TEntity[]>({
      queryKey: keys.list(params),
      queryFn: () =>
        apiClient.get<TEntity[]>(urls?.list?.(params) ?? baseUrl, {
          params: params ?? undefined,
        }),
      ...options,
    });
  }

  // ── useDetail ────────────────────────────────────────────────────────

  function useDetail(
    id: string | undefined,
    options?: Omit<UseQueryOptions<TEntity>, "queryKey" | "queryFn" | "enabled">,
  ) {
    return useQuery<TEntity>({
      queryKey: keys.detail(id ?? ""),
      queryFn: () => {
        // `enabled: !!id` guarantees id is defined before queryFn runs,
        // but we add an explicit guard to satisfy strict TypeScript and
        // protect against direct prefetchQuery calls that bypass `enabled`.
        if (!id) return Promise.reject(new Error("useDetail called without id"));
        return apiClient.get<TEntity>(urls?.detail?.(id) ?? `${baseUrl}/${id}`);
      },
      enabled: !!id,
      ...options,
    });
  }

  // ── useCreate ────────────────────────────────────────────────────────

  function useCreate() {
    const qc = useQueryClient();
    const { onError } = useApiErrorToast();
    return useMutation<TEntity, Error, TCreateDto>({
      mutationFn: (dto) =>
        apiClient.post<TEntity, TCreateDto>(urls?.create?.() ?? baseUrl, dto),
      onSuccess: () => {
        const targets = invalidateOn?.create ?? [keys.all];
        targets.forEach((q) => qc.invalidateQueries({ queryKey: q }));
      },
      onError,
    });
  }

  // ── useUpdate ────────────────────────────────────────────────────────

  function useUpdate() {
    const qc = useQueryClient();
    const { onError } = useApiErrorToast();
    return useMutation<TEntity, Error, { id: string; dto: TUpdateDto }>({
      mutationFn: ({ id, dto }) =>
        apiClient.put<TEntity, TUpdateDto>(
          urls?.update?.(id) ?? `${baseUrl}/${id}`,
          dto,
        ),
      onSuccess: (_data, variables) => {
        const targets =
          invalidateOn?.update ?? [keys.all, keys.detail(variables.id)];
        targets.forEach((q) => qc.invalidateQueries({ queryKey: q }));
      },
      onError,
    });
  }

  // ── usePatch (partial update) ─────────────────────────────────────────

  function usePatch() {
    const qc = useQueryClient();
    const { onError } = useApiErrorToast();
    return useMutation<TEntity, Error, { id: string; dto: Partial<TUpdateDto> }>({
      mutationFn: ({ id, dto }) =>
        apiClient.patch<TEntity, Partial<TUpdateDto>>(
          urls?.update?.(id) ?? `${baseUrl}/${id}`,
          dto,
        ),
      onSuccess: (_data, variables) => {
        const targets =
          invalidateOn?.update ?? [keys.all, keys.detail(variables.id)];
        targets.forEach((q) => qc.invalidateQueries({ queryKey: q }));
      },
      onError,
    });
  }

  // ── useRemove ────────────────────────────────────────────────────────

  function useRemove() {
    const qc = useQueryClient();
    const { onError } = useApiErrorToast();
    return useMutation<void, Error, string>({
      mutationFn: (id) =>
        apiClient.delete<void>(urls?.remove?.(id) ?? `${baseUrl}/${id}`),
      onSuccess: () => {
        const targets = invalidateOn?.remove ?? [keys.all];
        targets.forEach((q) => qc.invalidateQueries({ queryKey: q }));
      },
      onError,
    });
  }

  return { useList, useDetail, useCreate, useUpdate, usePatch, useRemove };
}
