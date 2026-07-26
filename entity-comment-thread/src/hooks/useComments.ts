import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  searchComments,
  updateCommentBody,
  updateCommentStatus,
  type CreateCommentInput,
} from "../api/comments";

interface UseCommentsOptions {
  baseUrl: string | null;
  token: string | null;
  commentBlueprintId: string;
  subjectBlueprintId: string;
  subjectIdentifier: string;
}

export function useComments({
  baseUrl,
  token,
  commentBlueprintId,
  subjectBlueprintId,
  subjectIdentifier,
}: UseCommentsOptions) {
  const queryClient = useQueryClient();
  const queryKey = [
    "comments",
    commentBlueprintId,
    subjectBlueprintId,
    subjectIdentifier,
    token,
  ];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      searchComments(
        baseUrl!,
        token!,
        commentBlueprintId,
        subjectBlueprintId,
        subjectIdentifier
      ),
    enabled:
      !!baseUrl &&
      !!token &&
      !!commentBlueprintId &&
      !!subjectBlueprintId &&
      !!subjectIdentifier,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCommentInput) =>
      createComment(baseUrl!, token!, commentBlueprintId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      commentIdentifier,
      status,
    }: {
      commentIdentifier: string;
      status: "open" | "resolved";
    }) =>
      updateCommentStatus(
        baseUrl!,
        token!,
        commentBlueprintId,
        commentIdentifier,
        status
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({
      commentIdentifier,
      body,
    }: {
      commentIdentifier: string;
      body: string;
    }) =>
      updateCommentBody(baseUrl!, token!, commentBlueprintId, commentIdentifier, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentIdentifier: string) =>
      deleteComment(baseUrl!, token!, commentBlueprintId, commentIdentifier),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return { query, createMutation, editMutation, statusMutation, deleteMutation };
}
