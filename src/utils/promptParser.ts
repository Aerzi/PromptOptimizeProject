import { v4 as uuidv4 } from 'uuid';
import type { PromptModule } from '@/types/prompt';

const COLORS = ['red', 'orange', 'green', 'blue', 'purple'];

export function parseMarkdownToModules(markdown: string): PromptModule[] {
  const lines = markdown.split('\n');
  const root: PromptModule = {
    id: 'root',
    title: 'root',
    content: '',
    level: 0,
    children: [],
  };

  const stack: PromptModule[] = [root];
  let currentContentLines: string[] = [];
  
  // Keep track of color index globally or per level?
  // User says "random assignment", "provide 5".
  // Simple round-robin is usually best for "non-repetitive" look.
  let colorIndex = 0;
  
  // Helper to pick next color
  const getNextColor = () => {
      const c = COLORS[colorIndex % COLORS.length];
      colorIndex++;
      return c;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#+)\s+(.*)/);

    if (headingMatch) {
      // Flush content to the current top of stack (which is the previous module)
      if (currentContentLines.length > 0 && stack.length > 1) {
        stack[stack.length - 1].content = currentContentLines.join('\n').trim();
        currentContentLines = [];
      } else if (currentContentLines.length > 0 && stack.length === 1) {
         const preamble: PromptModule = {
          id: uuidv4(),
          title: '前言', // Preamble
          content: currentContentLines.join('\n').trim(),
          level: 1, 
          children: [],
          color: getNextColor()
        };
        root.children.push(preamble);
        currentContentLines = [];
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2];

      const newModule: PromptModule = {
        id: uuidv4(),
        title,
        content: '',
        level,
        children: [],
        collapsed: false,
        color: getNextColor()
      };

      // Find parent
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      parent.children.push(newModule);
      stack.push(newModule);

    } else {
      currentContentLines.push(line);
    }
  }

  // Flush remaining content
  if (currentContentLines.length > 0 && stack.length > 1) {
    stack[stack.length - 1].content = currentContentLines.join('\n').trim();
  } else if (currentContentLines.length > 0 && stack.length === 1) {
     const preamble: PromptModule = {
        id: uuidv4(),
        title: '前言',
        content: currentContentLines.join('\n').trim(),
        level: 1,
        children: [],
        color: getNextColor()
      };
      root.children.push(preamble);
  }

  return root.children;
}

