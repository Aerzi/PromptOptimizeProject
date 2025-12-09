import type { PromptModule } from '@/types/prompt';

export function assembleModulesToMarkdown(modules: PromptModule[]): string {
  let markdown = '';

  function traverse(module: PromptModule) {
    if (module.title !== '前言' || module.level > 0) { // Skip "Preamble" title if we used that hack, or handle differently.
       // Actually, if we generated "前言" module for top text, we probably shouldn't print "# 前言" if the user didn't type it.
       // But the requirement implies strict "#" mapping.
       // "毫无前缀的内容则为正文" -> If I wrapped it in a module, I need to know if I should print the header.
       // For now, let's assume standard behavior: print header if it's not a special "headless" module.
       // But my parser creates standard modules.
       // Let's refine the parser later if needed. For now, we print headers.
       // If the user deletes the title in UI, maybe we treat it as text only?
       // Requirement: "# xxx" -> Title.
       // So if I have a module, it must have a header unless it's the preamble.
    }
    
    if (module.level > 0) {
        markdown += `${'#'.repeat(module.level)} ${module.title}\n`;
    }
    
    if (module.content) {
      markdown += `${module.content}\n`;
    }

    // Add newline between blocks if needed
    if (module.content || module.level > 0) {
        markdown += '\n';
    }

    if (module.children && module.children.length > 0) {
      module.children.forEach(traverse);
    }
  }

  modules.forEach(traverse);
  
  return markdown.trim();
}

