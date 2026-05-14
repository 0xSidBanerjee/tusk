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

export const parseDeadline = (d: string): string | undefined => {
  if (!d) return undefined;

  // Handle dd-mm-yyyy and dd-mm-yy
  const dmMatch = d.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmMatch) {
    let [_, day, month, year] = dmMatch;
    if (year.length === 2) {
      year = "20" + year; // Assume 20xx
    }
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

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
    priority = isValidPriority(parts[1]) ? parsePriority(parts[1]) : undefined;
    deadline = parseDeadline(parts[2]);
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

