interface PromptDataRes {
  message: string;
  prompt: string;
}

interface UpdatePromptReq {
  prompt: string;
}

export type { PromptDataRes, UpdatePromptReq };
