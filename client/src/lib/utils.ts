import { twMerge } from "tailwind-merge";

// Define ClassValue type
export type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean } | ClassValue[];

// Simple implementation of clsx that matches the expected behavior
function clsx(...inputs: any[]): string {
  const classNames: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    const inputType = typeof input;
    
    if (inputType === 'string' || inputType === 'number') {
      classNames.push(input.toString());
    } else if (Array.isArray(input)) {
      const nestedClasses = clsx(...input);
      if (nestedClasses) {
        classNames.push(nestedClasses);
      }
    } else if (inputType === 'object') {
      for (const key in input) {
        if (input[key]) {
          classNames.push(key);
        }
      }
    }
  }
  
  return classNames.join(' ');
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
