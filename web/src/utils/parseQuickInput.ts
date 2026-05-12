import * as chrono from 'chrono-node';
import { CreateTaskRequest, Priority } from '../types/task';

const isValidPriority = (p: string): boolean => {
  const normalized = p.toLowerCase();
  return ['high', 'medium', 'low'].includes(normalized);
};

const parsePriority = (p: string): Priority => {
  const normalized = p.toLowerCase();
  switch (normalized) {
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
};

const parseDeadline = (d: string): string | undefined => {
  if (!d) return undefined;
  // Try to parse as ISO date first to avoid chrono misinterpretation if any
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(d).toISOString();
  }
  const parsed = chrono.parseDate(d);
  if (parsed) {
    return parsed.toISOString();
  }
  return undefined;
};

export const parseQuickInput = (raw: string): CreateTaskRequest => {
  const parts = raw.split('|').map((p) => p.trim());

  if (parts.length === 1) {
    return {
      title: parts[0],
    };
  }

  let title = parts[0];
  let deadline: string | undefined = undefined;
  let priority: Priority | undefined = undefined;

  if (parts.length >= 3) {
    deadline = parseDeadline(parts[1]);
    priority = isValidPriority(parts[2]) ? parsePriority(parts[2]) : undefined;
  } else if (parts.length === 2) {
    if (isValidPriority(parts[1])) {
      priority = parsePriority(parts[1]);
    } else {
      deadline = parseDeadline(parts[1]);
    }
  }

  return {
    title,
    priority,
    deadline,
  };
};

