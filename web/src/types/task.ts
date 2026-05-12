export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
}

export interface GetTasksResponse {
  data: Task[] | null;
  total: number;
  page: number;
  page_size: number;
}

