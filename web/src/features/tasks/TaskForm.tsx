import { useState } from "react";
import { Task, Priority } from "../../types/task";
import { cn } from "../../lib/utils";

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
}

export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<Priority | undefined>(initialData?.priority);
  const [deadline, setDeadline] = useState(
    initialData?.deadline ? initialData.deadline.split("T")[0] : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description: description || undefined,
      priority: priority || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-3 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some details..."
          rows={3}
          className="w-full px-3 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            value={priority || ""}
            onChange={(e) => setPriority(e.target.value as Priority || undefined)}
            className="w-full px-3 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="">None</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          {initialData ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
