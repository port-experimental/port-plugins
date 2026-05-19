import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  searchCommentsForSubject,
  updateThreadStatus,
} from "../api/comments";
import type { SubjectContext, ThreadStatus } from "../types";
import { buildCommentThreads } from "../utils/commentTree";

export function useComments(
  subject: SubjectContext | null,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(subject && portToken && portApiBaseUrl);

  const query = useQuery({
    queryKey: [
      "comments",
      subject?.blueprint,
      subject?.identifier,
      portApiBaseUrl,
    ],
    enabled,
    queryFn: () =>
      searchCommentsForSubject(
        portApiBaseUrl!,
        portToken!,
        subject!
      ),
  });

  const threads = buildCommentThreads(query.data ?? []);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["comments", subject?.blueprint, subject?.identifier],
    });

  const postComment = useMutation({
    mutationFn: (input: {
      body: string;
      author: string;
      mentions: string[];
      parentCommentId?: string;
    }) =>
      createComment(portApiBaseUrl!, portToken!, {
        ...input,
        subject: subject!,
      }),
    onSuccess: invalidate,
  });

  const setThreadStatus = useMutation({
    mutationFn: ({
      rootCommentId,
      threadStatus,
    }: {
      rootCommentId: string;
      threadStatus: ThreadStatus;
    }) =>
      updateThreadStatus(
        portApiBaseUrl!,
        portToken!,
        rootCommentId,
        threadStatus
      ),
    onSuccess: invalidate,
  });

  return {
    threads,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    postComment,
    setThreadStatus,
  };
}
