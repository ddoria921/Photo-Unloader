type ClassInput = string | null | false | undefined;

export function cn(...inputs: ClassInput[]): string {
  return inputs.filter(Boolean).join(' ');
}
