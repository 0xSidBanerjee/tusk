export type Priority = "High" | "Medium" | "Low";

export interface List {
  id: string;
  name: string;
  color: string;
  created_at: string;
  total_count: number;
  incomplete_count: number;
}


export interface Task {
  id: string;
  list_id: string | null;
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  status: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  list_id?: string;
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


