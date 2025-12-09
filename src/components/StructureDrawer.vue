<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- Panel -->
    <div class="relative w-80 h-full bg-white shadow-xl flex flex-col transform transition-transform duration-300 slide-in-right">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
                <ListTreeIcon class="w-4 h-4 text-primary" />
                提示词大纲
            </h3>
            <button @click="$emit('close')" class="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors cursor-pointer">
                <XIcon class="w-5 h-5" />
            </button>
        </div>
        
        <div class="p-4 border-b border-gray-100 grid grid-cols-2 gap-4 bg-white">
             <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                <div class="text-xs text-gray-500 mb-1">总模块</div>
                <div class="text-xl font-bold text-gray-800">{{ store.stats.moduleCount }}</div>
             </div>
             <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                <div class="text-xs text-gray-500 mb-1">最大深度</div>
                <div class="text-xl font-bold text-gray-800">{{ maxDepth }}</div>
             </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div v-if="flattenedNodes.length === 0" class="text-center text-gray-400 text-sm mt-10">
                暂无结构
            </div>
            <ul v-else class="space-y-1">
                <li v-for="node in flattenedNodes" :key="node.id" 
                    class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors group"
                >
                    <!-- Indentation lines -->
                    <div class="flex shrink-0" :style="{ width: `${(node.depth) * 12}px` }"></div>
                    
                    <!-- Bullet/Icon -->
                    <div class="w-1.5 h-1.5 rounded-full shrink-0" 
                        :class="[
                            node.depth === 0 ? 'bg-primary' : 'bg-gray-300'
                        ]"
                    ></div>
                    
                    <!-- Content -->
                    <span class="text-sm truncate select-none"
                        :class="[
                            node.depth === 0 ? 'font-medium text-gray-800' : 'text-gray-600'
                        ]"
                    >
                        {{ node.title }}
                    </span>
                    
                    <span class="ml-auto text-[10px] text-gray-300 group-hover:text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        H{{ node.level }}
                    </span>
                </li>
            </ul>
        </div>
        
        <div class="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400">
            仅展示大纲结构
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePromptStore } from '@/stores/promptStore';
import { X as XIcon, ListTree as ListTreeIcon } from 'lucide-vue-next';
import type { PromptModule } from '@/types/prompt';

defineProps<{
  isOpen: boolean
}>();

defineEmits<{
  (e: 'close'): void
}>();

const store = usePromptStore();

interface FlatNode {
    id: string;
    title: string;
    level: number; // Heading level (#)
    depth: number; // Tree depth (0, 1, 2...)
}

const flattenedNodes = computed(() => {
    const result: FlatNode[] = [];
    
    function traverse(modules: PromptModule[], depth: number) {
        modules.forEach(m => {
            result.push({
                id: m.id,
                title: m.title,
                level: m.level,
                depth: depth
            });
            if (m.children && m.children.length > 0) {
                traverse(m.children, depth + 1);
            }
        });
    }
    
    traverse(store.modules, 0);
    return result;
});

const maxDepth = computed(() => {
    let max = 0;
    flattenedNodes.value.forEach(n => {
        if (n.depth + 1 > max) max = n.depth + 1;
    });
    return max;
});

</script>

<style scoped>
.slide-in-right {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
</style>

