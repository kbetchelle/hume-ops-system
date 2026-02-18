// Shared color mapping for checklist task types
// Based on the standardized Female Spa Attendant PM pattern

export const TASK_TYPE_COLOR_MAP: Record<string, string> = {
  checkbox: 'blue',
  photo: 'purple',
  signature: 'pink',
  yes_no: 'orange',
  multiple_choice: 'yellow',
  free_response: 'teal',
  short_entry: 'green',
  employee: 'gray',
};

export const COLOR_BORDER_MAP: Record<string, string> = {
  red: 'border-l-add-crimson',
  orange: 'border-l-add-amber',
  yellow: 'border-l-yellow-500',
  green: 'border-l-green-500',
  blue: 'border-l-add-skyBlue',
  purple: 'border-l-purple-500',
  gray: 'border-l-gray-500',
  teal: 'border-l-add-olive',
  pink: 'border-l-add-burntOrange',
};

export const COLOR_BG_MAP: Record<string, string> = {
  red: 'bg-add-crimson/5',
  orange: 'bg-add-amber/5',
  yellow: 'bg-yellow-500/5',
  green: 'bg-green-500/5',
  blue: 'bg-add-skyBlue/5',
  purple: 'bg-purple-500/5',
  gray: 'bg-gray-500/5',
  teal: 'bg-add-olive/5',
  pink: 'bg-add-burntOrange/5',
};

export function getTaskColorClass(taskType: string, checkboxIndex?: number): string {
  let color = TASK_TYPE_COLOR_MAP[taskType];
  // Alternate checkbox colors between blue and green by hourly block
  if (taskType === 'checkbox' && checkboxIndex !== undefined) {
    color = checkboxIndex % 2 === 0 ? 'blue' : 'green';
  }
  if (!color) return '';
  return `border-l-4 ${COLOR_BORDER_MAP[color] || ''} ${COLOR_BG_MAP[color] || ''}`;
}
