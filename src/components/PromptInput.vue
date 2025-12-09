<template>
  <div class="flex flex-col h-full relative group">
      <textarea
        v-model="store.rawInput"
        class="w-full h-full resize-none p-4 focus:outline-none text-sm leading-relaxed font-mono bg-transparent custom-scrollbar transition-colors"
        :class="{'bg-gray-50 text-gray-500': isLocked}"
        :readonly="isLocked"
        placeholder="在此粘贴或输入 Markdown 格式的提示词..."
      ></textarea>
      
      <!-- Actions Overlay -->
      <div class="absolute bottom-4 right-4 flex gap-2">
          <button 
            v-if="!isLocked"
            @click="handleImport"
            class="bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-lg backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Wand2Icon class="w-3.5 h-3.5" />
            开始优化 (生成模块)
          </button>
          
          <button 
            v-else
            @click="isLocked = false"
            class="bg-white/80 hover:bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UnlockIcon class="w-3.5 h-3.5" />
            解锁编辑
          </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePromptStore } from '@/stores/promptStore';
import { Wand2 as Wand2Icon, Unlock as UnlockIcon } from 'lucide-vue-next';

const store = usePromptStore();
const isLocked = ref(store.modules.length > 0); // Auto-lock if content exists

const handleImport = () => {
    if (!store.rawInput.trim()) return;
    
    // Check if we are overwriting
    if (store.modules.length > 0) {
        if (!confirm('重新生成将覆盖当前的模块化编辑内容，确定要继续吗？')) {
            return;
        }
    }
    
    store.parseInput();
    isLocked.value = true;
};
</script>

