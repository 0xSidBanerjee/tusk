import axios from "axios";
import { GetTasksResponse, Priority, Task } from "../types/task";

const api = axios.create({
  baseURL: "/api/v1",
});

export const getTasks = async (params: {
  priority?: Priority;
  status?: boolean;
  page?: number;
  page_size?: number;
}) => {
  const { data } = await api.get<GetTasksResponse>("/tasks", { params });
  return data;
};

export const createTask = async (task: Partial<Task>) => {
  const { data } = await api.post<Task>("/tasks", task);
  return data;
};

export const updateTask = async (id: string, task: Partial<Task>) => {
  const { data } = await api.put<Task>(`/tasks/${id}`, task);
  return data;
};

export const deleteTask = async (id: string) => {
  await api.delete(`/tasks/${id}`);
};
