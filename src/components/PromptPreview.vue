<template>
  <div class="flex-1 flex flex-col h-full bg-gray-50/30">
    <!-- Analysis Panel -->
    <div class="p-4 border-b border-gray-200 bg-white">
        <div class="flex flex-col gap-3 mb-4">
            <div class="flex items-center justify-between">
                <h3 class="font-medium text-sm text-gray-700">结构完整度参考</h3>
                <div 
                    class="px-2 py-0.5 rounded-full text-xs font-bold"
                    :class="[
                        store.analysis.score >= 80 ? 'bg-green-100 text-green-700' :
                        store.analysis.score >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                    ]"
                 >
                    {{ store.analysis.score }} 分
                 </div>
            </div>
            
            <div class="flex items-center justify-between gap-2 relative">
                <div class="relative flex-1 min-w-0">
                    <button 
                        @click="isModelDropdownOpen = !isModelDropdownOpen"
                        class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50 hover:bg-white hover:border-gray-300 focus:outline-none focus:border-primary text-gray-600 flex items-center justify-between transition-all cursor-pointer"
                    >
                        <span class="truncate">{{ currentModelLabel }}</span>
                        <ChevronDownIcon class="w-3 h-3 opacity-50" />
                    </button>
                    
                    <!-- Backdrop -->
                    <div v-if="isModelDropdownOpen" class="fixed inset-0 z-10" @click="isModelDropdownOpen = false"></div>

                    <!-- Dropdown Menu -->
                    <div v-if="isModelDropdownOpen" class="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 max-h-48 overflow-auto">
                        <button 
                            v-for="opt in modelOptions" 
                            :key="opt.value"
                            @click="selectModel(opt.value)"
                            class="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between group transition-colors cursor-pointer"
                            :class="store.selectedModel === opt.value ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'"
                        >
                            <span>{{ opt.label }}</span>
                            <CheckIcon v-if="store.selectedModel === opt.value" class="w-3 h-3 text-primary" />
                        </button>
                    </div>
                </div>

                 <div class="text-xs text-gray-500 whitespace-nowrap">
                    {{ store.stats.tokenCount }} Tokens
                 </div>
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
            <div 
                class="h-full transition-all duration-500 ease-out rounded-full"
                :class="[
                    store.analysis.score >= 80 ? 'bg-green-500' :
                    store.analysis.score >= 60 ? 'bg-orange-500' :
                    'bg-blue-500'
                ]"
                :style="{ width: `${store.analysis.score}%` }"
            ></div>
        </div>

        <!-- Checklist -->
        <div class="grid grid-cols-5 gap-1 mb-4">
             <div v-for="(label, key) in checkLabels" :key="key" 
                class="flex flex-col items-center gap-1 p-2 rounded bg-gray-50 transition-opacity"
                :class="{'opacity-40 grayscale': !store.analysis.checks[key as keyof typeof store.analysis.checks]}"
             >
                <div 
                    class="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                    :class="store.analysis.checks[key as keyof typeof store.analysis.checks] ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'"
                >
                    <CheckIcon v-if="store.analysis.checks[key as keyof typeof store.analysis.checks]" class="w-3 h-3" />
                </div>
                <span class="text-[10px] text-gray-500">{{ label }}</span>
             </div>
        </div>
        
        <!-- Suggestions -->
        <div v-if="store.analysis.suggestions.length > 0" class="space-y-2 mb-4">
            <div 
                v-for="(sugg, idx) in store.analysis.suggestions" 
                :key="idx"
                class="text-xs p-2 rounded border flex items-start gap-2"
                :class="[
                    sugg.type === 'missing' ? 'bg-red-50 border-red-100 text-red-700' :
                    sugg.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                ]"
            >
                <AlertCircleIcon class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{{ sugg.text }}</span>
            </div>
        </div>
        <div v-else class="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 flex items-center gap-2 mb-4">
             <CheckCircleIcon class="w-3.5 h-3.5 text-green-500" />
             <span>提示词结构看起来很棒！</span>
        </div>

        <!-- Variables -->
        <div v-if="store.analysis.variables.length > 0" class="border-t border-gray-100 pt-3">
            <div class="flex items-center gap-1.5 mb-2 text-xs text-gray-500 font-medium">
                <BracesIcon class="w-3 h-3" />
                检测到变量 ({{ store.analysis.variables.length }})
            </div>
            <div class="flex flex-wrap gap-1.5">
                <span 
                    v-for="v in store.analysis.variables" 
                    :key="v"
                    class="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-600"
                >
                    {{ v }}
                </span>
            </div>
        </div>
    </div>

    <!-- Preview Area -->
    <div class="flex-1 relative group bg-white border-t border-gray-200">
        <textarea
            readonly
            :value="store.previewPrompt"
            class="w-full h-full resize-none p-4 focus:outline-none text-sm leading-relaxed font-mono text-gray-700 custom-scrollbar"
        ></textarea>
        
        <button 
            @click="copyToClipboard"
            class="absolute top-4 right-4 bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-md text-xs font-medium transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2 shadow-lg backdrop-blur-sm cursor-pointer"
        >
            <CopyIcon class="w-3.5 h-3.5" />
            复制内容
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePromptStore, type ModelType } from '@/stores/promptStore';
import { Copy as CopyIcon, Check as CheckIcon, AlertCircle as AlertCircleIcon, CheckCircle as CheckCircleIcon, ChevronDown as ChevronDownIcon, Braces as BracesIcon } from 'lucide-vue-next';

const store = usePromptStore();
const isModelDropdownOpen = ref(false);

const modelOptions: { value: ModelType; label: string }[] = [
    { value: 'generic', label: '通用模型' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-3-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'llama-2-7b', label: 'Llama 2 (7B)' },
];

const currentModelLabel = computed(() => {
    return modelOptions.find(o => o.value === store.selectedModel)?.label || '通用模型';
});

const selectModel = (val: ModelType) => {
    store.selectedModel = val;
    isModelDropdownOpen.value = false;
};

const checkLabels = {
    role: '角色',
    task: '任务',
    constraints: '约束',
    format: '格式',
    examples: '示例'
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(store.previewPrompt);
        alert('已复制到剪贴板');
    } catch (err) {
        console.error('Failed to copy', err);
    }
};
</script>

