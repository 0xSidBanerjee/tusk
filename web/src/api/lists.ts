import axios from "axios";
import { List } from "../types/task";

const API_BASE = "/api/v1";

export async function getLists(): Promise<{ data: List[] }> {
  const response = await axios.get(`${API_BASE}/lists`);
  return response.data;
}

export async function createList(data: { name: string; color: string }): Promise<List> {
  const response = await axios.post(`${API_BASE}/lists`, data);
  return response.data;
}

export async function updateList(id: string, data: Partial<List>): Promise<List> {
  const response = await axios.put(`${API_BASE}/lists/${id}`, data);
  return response.data;
}

export async function deleteList(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/lists/${id}`);
}
