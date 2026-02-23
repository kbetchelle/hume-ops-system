// Shared color mapping for checklist task types
// Uses add_color palette for consistency with notification system

import type React from 'react';
import { add_color } from '@/lib/constants';

export const TASK_TYPE_COLOR_HEX: Record<string, string> = {
  checkbox: add_color.blue,
  photo: add_color.purple,
  signature: add_color.orange,
  yes_no: add_color.yellow,
  multiple_choice: add_color.green,
  free_response: add_color.blue,
  short_entry: add_color.green,
  employee: add_color.purple,
  header: add_color.red,
};

/**
 * Returns inline style object for checklist item left border + tinted background.
 * Uses add_color hex values for build stability (no Tailwind purge issues).
 */
export function getTaskColorStyle(
  taskType: string,
  checkboxIndex?: number,
  timeHint?: string
): React.CSSProperties {
  let hex = TASK_TYPE_COLOR_HEX[taskType];

  // End of Shift tasks always use green
  if (timeHint === 'End of Shift') {
    hex = add_color.green;
  }
  // Alternate checkbox colors between blue and green
  else if (taskType === 'checkbox' && checkboxIndex !== undefined) {
    hex = checkboxIndex % 2 === 0 ? add_color.blue : add_color.green;
  }

  if (!hex) return {};

  return {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: hex,
    backgroundColor: `${hex}0D`, // ~5% opacity
  };
}

// Keep legacy class-based function for backward compat
export function getTaskColorClass(_taskType: string, _checkboxIndex?: number): string {
  return '';
}
