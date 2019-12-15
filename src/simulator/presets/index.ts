import { text as examplesText } from './examples';
import { text as referenceText } from './reference';

function preset(text: string): Map<string, string> {
  const map = new Map<string, string>();
  let title: string | undefined;
  let body = '';

  for (const line of text.split(/\n/)) {
    if (line.startsWith('---')) {
      if (title) map.set(title, body.trim());
      title = line.substring(3).trim();
      body = '';
    } else {
      body += line + '\n';
    }
  }

  return map;
}

export const examples = preset(examplesText);
export const reference = preset(referenceText);
