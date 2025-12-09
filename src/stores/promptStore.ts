import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { PromptModule } from '@/types/prompt';
import { parseMarkdownToModules } from '@/utils/promptParser';
import { assembleModulesToMarkdown } from '@/utils/promptAssembler';
import { v4 as uuidv4 } from 'uuid';

export type ModelType = 'gpt-4' | 'claude-3-sonnet' | 'llama-2-7b' | 'generic';

export const usePromptStore = defineStore('prompt', () => {
  const rawInput = ref('');
  const modules = ref<PromptModule[]>([]);
  const selectedModel = ref<ModelType>('generic');
  
  // History State
  const history = ref<string[]>([]);
  const historyIndex = ref(-1);
  let isHistoryNavigating = false;

  // Load from local storage
  const storedInput = localStorage.getItem('prompt_rawInput');
  const storedModules = localStorage.getItem('prompt_modules');
  const storedModel = localStorage.getItem('prompt_model');

  if (storedInput) rawInput.value = storedInput;
  if (storedModules) {
      try {
        modules.value = JSON.parse(storedModules);
      } catch (e) {
          console.error("Failed to parse modules", e);
      }
  }
  if (storedModel) selectedModel.value = storedModel as ModelType;

  // Action to update modules from input (Initial Parse)
  function parseInput() {
    const newModules = parseMarkdownToModules(rawInput.value);
    
    // Soft update: Try to preserve existing state (id, color, collapsed)
    // We map old modules by a key like "level-title" or just index if simple
    // A simple heuristic: flatten both trees, match by (level, title), preserve if found.
    // This is complex for nested trees.
    // Let's implement a recursive merger.
    
    function mergeModules(newMods: PromptModule[], oldMods: PromptModule[]): PromptModule[] {
        return newMods.map((newMod, index) => {
            // Try to find a matching module in oldMods
            // Strategy: Match by Title AND Level. If multiple, try to use index.
            const matchIndex = oldMods.findIndex(om => om.title === newMod.title && om.level === newMod.level);
            
            if (matchIndex !== -1) {
                const oldMod = oldMods[matchIndex];
                // Found a match! Preserve ID, Color, Collapsed
                // Remove from oldMods to avoid matching again (optional, but good for duplicates)
                // oldMods.splice(matchIndex, 1); // Mutation might be tricky if we iterate.
                
                // Content change check: if content changed, update it.
                // But if content hasn't changed, we can technically keep the old object reference?
                // Actually, newMod has the new content.
                // If only content changed, ID/Color/Collapsed are preserved, which is what we want.
                
                // Recursively merge children
                const mergedChildren = mergeModules(newMod.children, oldMod.children);
                
                return {
                    ...newMod,
                    id: oldMod.id,
                    color: oldMod.color,
                    collapsed: oldMod.collapsed,
                    children: mergedChildren
                };
            } else {
                // If no exact match by title, maybe it's a rename?
                // Heuristic: If oldMods has a module at the same index with same level but different title?
                // This is risky if user inserted a module.
                // Let's stick to Title+Level match for safety first.
                // But wait, user said "if user modifies content of one module".
                // If user modifies CONTENT, title is same. So matchIndex !== -1.
                // So current logic handles content update perfectly (id preserved).
                
                // Problem: If user modifies TITLE?
                // Then matchIndex === -1. New module created. Old ID lost. Color lost.
                // Can we detect rename?
                // If the structure (sequence of levels) is identical, but one title changed?
                
                // Let's try a positional fallback if exact match fails.
                // If oldMods[index] exists and has same level, assume it's the same module (rename).
                if (index < oldMods.length && oldMods[index].level === newMod.level) {
                     const oldMod = oldMods[index];
                     // Check if this oldMod is "claimed" by another exact match elsewhere?
                     // Ideally we should do a first pass for exact matches, then second pass for positional.
                     // But for simple "edit title in place", positional usually works if list length didn't change.
                     
                     // Optimization: Only use positional fallback if we are relatively sure.
                     // E.g. newMods.length === oldMods.length
                     // This covers the case: User renames one module title in the text editor.
                     
                     // Let's verify if this oldMod wasn't matched by title elsewhere in newMods?
                     // Complexity: O(N^2) but N is small.
                     const isClaimedByExactMatch = newMods.some(nm => nm.title === oldMod.title && nm.level === oldMod.level);
                     
                     if (!isClaimedByExactMatch) {
                        const mergedChildren = mergeModules(newMod.children, oldMod.children);
                        return {
                            ...newMod,
                            id: oldMod.id,
                            color: oldMod.color,
                            collapsed: oldMod.collapsed,
                            children: mergedChildren
                        };
                     }
                }

                // No match, likely a new module. Assign a random color if not set by parser (parser sets one now).
                // We just return newMod as is.
                return newMod;
            }
        });
    }

    // Note: The simple title-matching has flaws if user renames a title (it will lose state).
    // But it's better than full reset.
    // A better approach for "Renaming" requires diffing content, which is hard.
    // For now, "Title + Level" stability is a huge step up.
    
    const merged = mergeModules(newModules, modules.value);
    modules.value = merged;
  }
  
  // Action to add a new module manually
  function addModule() {
      const colors = ['red', 'orange', 'green', 'blue', 'purple'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newModule: PromptModule = {
          id: uuidv4(),
          title: '新模块',
          content: '',
          level: 1,
          children: [],
          color: randomColor,
          collapsed: false
      };
      
      modules.value.push(newModule);
  }

  // History Actions
  function pushHistory() {
      if (isHistoryNavigating) return;
      
      const snapshot = JSON.stringify(modules.value);
      // Avoid duplicate pushes
      if (history.value.length > 0 && history.value[historyIndex.value] === snapshot) return;

      // If we are in the middle of history, discard future
      if (historyIndex.value < history.value.length - 1) {
          history.value = history.value.slice(0, historyIndex.value + 1);
      }
      
      history.value.push(snapshot);
      historyIndex.value++;
      
      // Limit size
      if (history.value.length > 50) {
          history.value.shift();
          historyIndex.value--;
      }
  }

  function undo() {
      if (historyIndex.value > 0) {
          isHistoryNavigating = true;
          historyIndex.value--;
          try {
            modules.value = JSON.parse(history.value[historyIndex.value]);
          } catch(e) { console.error('Undo failed', e); }
          
          // Re-sync input? 
          // Requirement: "Input -> Modules". If we undo modules, should input update?
          // "此处的编辑不会影响到用户的原始输入内容" -> Separate.
          // So we don't sync back to rawInput.
          
          setTimeout(() => { isHistoryNavigating = false; }, 10);
      }
  }

  function redo() {
      if (historyIndex.value < history.value.length - 1) {
          isHistoryNavigating = true;
          historyIndex.value++;
          try {
            modules.value = JSON.parse(history.value[historyIndex.value]);
          } catch(e) { console.error('Redo failed', e); }
          setTimeout(() => { isHistoryNavigating = false; }, 10);
      }
  }

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Computed preview
  const previewPrompt = computed(() => {
    return assembleModulesToMarkdown(modules.value);
  });

  const stats = computed(() => {
      let count = 0;
      let tokens = 0; 
      
      function traverse(list: PromptModule[]) {
          list.forEach(m => {
              count++;
              // Token estimation: 
              // Chinese char ~ 1.5 tokens (conservative) or 1-2 depending on model.
              // English word ~ 1.3 tokens. 
              // Simple heuristic: Count Chinese chars * 1.5 + Other chars / 3.5
              const text = m.title + ' ' + m.content;
              const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
              const otherChars = Math.max(0, text.length - chineseChars);
              
              tokens += chineseChars * 1.5 + otherChars / 3.5;
              
              if (m.children) traverse(m.children);
          });
      }
      traverse(modules.value);
      
      return {
          moduleCount: count,
          tokenCount: Math.ceil(tokens),
      };
  });

  const analysis = computed(() => {
      // Collect all titles and content
      let allText = '';
      const titles: string[] = [];
      
      function traverse(list: PromptModule[]) {
          list.forEach(m => {
              titles.push(m.title.toLowerCase());
              allText += m.title + ' ' + m.content + ' ';
              if (m.children) traverse(m.children);
          });
      }
      traverse(modules.value);
      allText = allText.toLowerCase();

      // Heuristics
      // 1. Check for specific functional modules (Keyword matching)
      const checks = {
          role: titles.some(t => /角色|身份|role|profile|persona|expert|you are|model/i.test(t)),
          task: titles.some(t => /任务|目标|功能|task|goal|objective|instruction|function|do|action/i.test(t)),
          constraints: titles.some(t => /约束|限制|准则|规则|要求|注意|constrain|rule|limit|attention|guideline|requirement/i.test(t)),
          format: titles.some(t => /格式|输出|风格|语气|format|output|style|response|tone/i.test(t)),
          examples: titles.some(t => /示例|例子|样本|参考|example|shot|case|sample/i.test(t))
      };

      let score = 0;
      
      // Base score from structure complexity
      if (stats.value.moduleCount >= 1) score += 20; // Has structure
      if (stats.value.moduleCount >= 3) score += 10; // Rich structure
      if (stats.value.tokenCount > 100) score += 10; // Decent length

      // Functional component score (Weighted)
      if (checks.role) score += 15;
      if (checks.task) score += 25; // Task is still very important
      if (checks.constraints) score += 10;
      if (checks.format) score += 10;
      if (checks.examples) score += 10;

      // Penalize mixed responsibilities
      let mixedPenalty = 0;
      const mixedModules = modules.value.filter(m => {
          const t = m.title.toLowerCase();
          let typesFound = 0;
          if (/角色|身份|role|profile|persona/i.test(t)) typesFound++;
          if (/任务|目标|功能|task|goal|objective/i.test(t)) typesFound++;
          if (/约束|限制|准则|规则|constrain|rule/i.test(t)) typesFound++;
          if (/格式|输出|format|output/i.test(t)) typesFound++;
          if (/示例|例子|example|shot/i.test(t)) typesFound++;
          return typesFound >= 2;
      });

      if (mixedModules.length > 0) mixedPenalty += 10;
      
      // Also check if high coverage but low module count (Global structure check)
      const coverageCount = Object.values(checks).filter(Boolean).length;
      if (coverageCount >= 3 && stats.value.moduleCount < 3) {
           mixedPenalty += 15;
      }

      score = Math.max(0, Math.min(100, score - mixedPenalty));

      // Suggestions
      const suggestions = [];
      if (mixedModules.length > 0) {
           suggestions.push({ 
              type: 'warning', 
              text: `模块 "${mixedModules[0].title}" 似乎包含多个主题，建议拆分为独立模块` 
          });
      }
      if (coverageCount >= 3 && stats.value.moduleCount < 3) {
           suggestions.push({
               type: 'warning',
               text: '结构过于紧凑，建议将角色、任务、约束等内容拆分为独立的模块'
           });
      }

      if (!checks.task && stats.value.moduleCount < 3) suggestions.push({ type: 'warning', text: '未检测到明确的【任务/目标】模块，建议明确 AI 具体要做什么' });
      if (!checks.role) suggestions.push({ type: 'tip', text: '可以尝试添加【角色】信息，帮助 AI 更好地理解上下文' });
      if (!checks.examples) suggestions.push({ type: 'tip', text: '提供【示例】(Few-Shot) 通常能显著提升回答的准确性' });
      
      // Model specific suggestions (General heuristic)
      // Based on provided guidance: 
      // Simple: 100-500 | Medium: 500-2000 | Complex: 2000-8000 | Safe Gold Range: 500-3000
      
      const tCount = stats.value.tokenCount;
      const model = selectedModel.value;

      // Dynamic thresholds based on model
      let maxTokens = 8000;
      let attentionLimit = 3000;
      
      if (model === 'llama-2-7b') {
          maxTokens = 2000; // 4k window, safe 2k
          attentionLimit = 1500;
      } else if (model === 'gpt-4') {
          maxTokens = 8000; // 32k window usually, safe 8k
          attentionLimit = 4000;
      } else if (model === 'claude-3-sonnet') {
          maxTokens = 15000; // Large window
          attentionLimit = 8000;
      }

      // Too short
      if (tCount < 100) {
          suggestions.push({ 
              type: 'warning', 
              text: '提示词过短（<100 token），仅适用于极简问答。建议补充细节以提升稳定性。' 
          });
      }
      
      // Long prompt attention warning
      if (tCount > attentionLimit) {
           suggestions.push({ 
               type: 'tip', 
               text: `提示词较长（>${attentionLimit} token），对于 ${model === 'generic' ? '通用' : model} 模型，建议将核心指令置于开头或结尾。` 
           });
      }
      
      // Extremely long warning
      if (tCount > maxTokens) {
           suggestions.push({
               type: 'warning',
               text: `提示词超出 ${model === 'generic' ? '常规' : model} 模型推荐上限（>${maxTokens} token），建议精简或使用 RAG。`
           });
      }
      
      // Model specific format suggestions
      if (model === 'claude-3-sonnet') {
           if (!titles.some(t => t.includes('xml') || allText.includes('<') && allText.includes('>'))) {
                suggestions.push({ type: 'tip', text: 'Claude 模型对 XML 格式支持极佳，建议使用 XML 标签包裹结构（如 <task>, <context>）。' });
           }
      } else if (model === 'gpt-4' || model === 'llama-2-7b') {
           if (!titles.some(t => t.includes('markdown') || allText.includes('```') || allText.includes('#'))) {
                suggestions.push({ type: 'tip', text: 'GPT/Llama 模型对 Markdown 格式理解最好，建议使用 # 标题和 - 列表。' });
           }
      }

      if (tCount > 100 && !checks.format) {
           suggestions.push({ type: 'tip', text: '对于复杂任务，建议明确指定输出格式（如 Markdown, JSON）' });
      }

      // Check for variables
      // Supports: {^var^}
      const variables = allText.match(/\{\^.*?\^\}/g) || [];
      const uniqueVars = [...new Set(variables)];

      return {
          score,
          checks,
          suggestions,
          variables: uniqueVars
      };
  });

  // Watchers for persistence
  // REMOVED: Auto-sync from rawInput to modules.
  // Rationale: User wants Left Panel to be "Reference" (Original), and Middle Panel to be "Work" (Optimized).
  // They should not auto-sync after initial import, otherwise editing the reference destroys the work.
  /*
  let debounceTimer: any;
  watch(rawInput, (newVal) => {
    localStorage.setItem('prompt_rawInput', newVal);
    
    // Debounce parse
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        parseInput();
    }, 1000);
  });
  */
  // We only persist the rawInput text, but don't trigger parse.
  watch(rawInput, (newVal) => {
      localStorage.setItem('prompt_rawInput', newVal);
  });
  
  watch(selectedModel, (newVal) => {
      localStorage.setItem('prompt_model', newVal);
  });

  watch(modules, (newVal) => {
      localStorage.setItem('prompt_modules', JSON.stringify(newVal));
      // Push history on change
      // Debounce history slightly to avoid per-keystroke pushes?
      // Or rely on the check inside pushHistory. 
      // Ideally push on every significant change.
      pushHistory();
  }, { deep: true });

  // Initialize history
  if (modules.value.length > 0) {
      pushHistory();
  }

  return {
    rawInput,
    modules,
    selectedModel,
    previewPrompt,
    stats,
    analysis,
    parseInput,
    addModule,
    undo,
    redo,
    canUndo,
    canRedo
  };
});

