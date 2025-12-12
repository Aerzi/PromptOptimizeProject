<template>
  <div 
    class="mb-3 rounded-lg border shadow-sm transition-all duration-200 overflow-hidden"
    :class="[
      colorClasses,
      isDragOver ? 'ring-2 ring-primary ring-offset-1' : ''
    ]"
  >
    <!-- Header Bar -->
    <div 
      class="flex items-center gap-2 p-2 border-b border-black/5 bg-black/5 cursor-pointer select-none group"
    >
      <div class="drag-handle cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-black/5">
        <GripVerticalIcon class="w-4 h-4" />
      </div>

      <div class="flex-1 font-medium text-sm flex items-center gap-2" @click="toggleCollapse">
        <span class="opacity-50 text-xs shrink-0">#{{ module.level }}</span>
        <span 
            v-if="!isEditingTitle" 
            :class="[
                'transition-all',
                module.level === 1 ? 'text-base font-bold text-gray-900' : 
                module.level === 2 ? 'text-sm font-bold text-gray-800' : 
                'text-sm font-medium text-gray-700'
            ]"
        >{{ module.title }}</span>
        <input 
            v-else 
            v-model="module.title" 
            class="bg-transparent focus:outline-none border-b border-black/20 w-full"
            :class="[
                module.level === 1 ? 'text-base font-bold' : 
                module.level === 2 ? 'text-sm font-bold' : 
                'text-sm font-medium'
            ]"
            @blur="isEditingTitle = false"
            @keydown.enter="isEditingTitle = false"
            ref="titleInput"
        />
      </div>

      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="p-1 hover:bg-black/10 rounded text-gray-500 cursor-pointer" @click="isEditingTitle = !isEditingTitle" title="编辑标题">
            <Edit2Icon class="w-3.5 h-3.5" />
        </button>
        <button class="p-1 hover:bg-black/10 rounded text-gray-500 relative group/color cursor-pointer" title="更改颜色">
            <PaletteIcon class="w-3.5 h-3.5" />
            <!-- Simple Color Picker Popup -->
            <div class="absolute right-0 top-full pt-2 z-10 hidden group-hover/color:block">
                <div class="bg-white border border-gray-200 p-2 rounded shadow-lg flex gap-1">
                    <div @click.stop="setColor('')" class="w-4 h-4 rounded-full border border-gray-200 cursor-pointer bg-white hover:scale-110 transition-transform" title="无色"></div>
                    <div @click.stop="setColor('red')" class="w-4 h-4 rounded-full cursor-pointer bg-red-100 border border-red-200 hover:scale-110 transition-transform" title="红色"></div>
                    <div @click.stop="setColor('orange')" class="w-4 h-4 rounded-full cursor-pointer bg-orange-100 border border-orange-200 hover:scale-110 transition-transform" title="橙色"></div>
                    <div @click.stop="setColor('green')" class="w-4 h-4 rounded-full cursor-pointer bg-green-100 border border-green-200 hover:scale-110 transition-transform" title="绿色"></div>
                    <div @click.stop="setColor('blue')" class="w-4 h-4 rounded-full cursor-pointer bg-blue-100 border border-blue-200 hover:scale-110 transition-transform" title="蓝色"></div>
                    <div @click.stop="setColor('purple')" class="w-4 h-4 rounded-full cursor-pointer bg-purple-100 border border-purple-200 hover:scale-110 transition-transform" title="紫色"></div>
                </div>
            </div>
        </button>
         <button 
            v-if="module.level < 4"
            class="p-1 hover:bg-black/10 rounded text-gray-500 cursor-pointer" 
            @click="addChild" 
            title="添加子模块"
         >
            <PlusIcon class="w-3.5 h-3.5" />
        </button>
         <button class="p-1 hover:bg-red-100 hover:text-red-500 rounded text-gray-500 cursor-pointer" @click="$emit('delete')" title="删除模块">
            <Trash2Icon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div v-if="!module.collapsed" class="p-3">
        <!-- Content -->
        <div class="mb-3 group/content relative">
            <textarea
                v-model="module.content"
                rows="1"
                class="w-full text-sm p-2 rounded border resize-none overflow-hidden leading-relaxed font-sans transition-all duration-200 ease-in-out placeholder:text-gray-400"
                :class="[
                    isEditingContent 
                        ? 'bg-white border-primary/30 shadow-sm ring-2 ring-primary/10 text-gray-900' 
                        : 'bg-transparent border-transparent hover:border-gray-200 text-gray-700'
                ]"
                @focus="handleContentFocus"
                @blur="handleContentBlur"
                @input="adjustHeight"
                ref="contentTextarea"
                placeholder="点击输入正文内容..."
            ></textarea>
        </div>

        <!-- Nested Children -->
        <div class="pl-4 border-l-2 border-black/5 mt-2">
            <draggable 
                v-model="module.children" 
                :group="{ name: 'g1' }"
                item-key="id"
                handle=".drag-handle"
                ghost-class="sortable-ghost"
                class="min-h-[40px] rounded-md transition-colors duration-200 pb-2"
                :class="[
                    module.children.length === 0 ? 'bg-black/5' : ''
                ]"
                @change="onDragChange"
            >
                <template #item="{ element, index }">
                    <ModuleItem 
                        :module="element" 
                        @delete="deleteChild(index)"
                    />
                </template>
            </draggable>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PromptModule } from '@/types/prompt';
import draggable from 'vuedraggable';
import { GripVertical as GripVerticalIcon, Edit2 as Edit2Icon, Palette as PaletteIcon, Trash2 as Trash2Icon, Plus as PlusIcon } from 'lucide-vue-next';

const props = defineProps<{
  module: PromptModule
}>();

const emit = defineEmits<{
  (e: 'delete'): void,
  (e: 'add-child'): void
}>();

const isEditingTitle = ref(false);
const isEditingContent = ref(false);
const isDragOver = ref(false);
const contentTextarea = ref<HTMLTextAreaElement | null>(null);

const adjustHeight = () => {
    const el = contentTextarea.value;
    if (el) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }
};

const handleContentFocus = (e: FocusEvent) => {
    isEditingContent.value = true;
    // Do NOT call adjustHeight() here. 
    // Calling el.style.height = 'auto' causes a momentary collapse which triggers browser scroll jumping.
    // The height is already correct from mounted/input events.
};

const handleContentBlur = () => {
    isEditingContent.value = false;
};

// Auto-adjust height on mount if content exists
import { onMounted, nextTick } from 'vue';
onMounted(() => {
    nextTick(() => {
        adjustHeight();
    });
});

const colorClasses = computed(() => {
    const c = props.module.color;
    if (!c) return 'bg-white border-gray-200';
    const map: Record<string, string> = {
        red: 'bg-red-50 border-red-200',
        orange: 'bg-orange-50 border-orange-200',
        green: 'bg-green-50 border-green-200',
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200',
    };
    return map[c] || 'bg-white border-gray-200';
});

const toggleCollapse = () => {
    if (!isEditingTitle.value) {
        props.module.collapsed = !props.module.collapsed;
    }
};

const setColor = (color: string) => {
    props.module.color = color;
};

const deleteChild = (index: number) => {
    props.module.children.splice(index, 1);
};

// Custom directive for auto-focus
const vFocus = {
  mounted: (el: HTMLElement) => {
      // Prevent scrolling on focus if it causes jumps
      el.focus({ preventScroll: true });
  }
};

const addChild = () => {
    // Limit nesting level to 4
    if (props.module.level >= 4) {
        alert('最多支持 4 层嵌套');
        return;
    }

    // We can emit or handle directly if we pass down store?
    // But better to emit for consistency or just push to props.module.children
    // It's reactive so mutation works.
    const newChild: PromptModule = {
        id: crypto.randomUUID(), // Native browser API or use uuid lib
        title: '新子模块',
        content: '',
        level: props.module.level + 1,
        children: [],
        color: props.module.color, // Inherit color or random? Usually same or neutral.
        collapsed: false
    };
    props.module.children.push(newChild);
    // Auto expand parent
    props.module.collapsed = false;
};

const updateChildrenLevels = (mod: PromptModule) => {
    if (mod.children && mod.children.length > 0) {
        mod.children.forEach(child => {
            child.level = mod.level + 1;
            updateChildrenLevels(child);
        });
    }
};

const onDragChange = (evt: any) => {
    if (evt.added) {
        evt.added.element.level = props.module.level + 1;
        updateChildrenLevels(evt.added.element);
    }
};
</script>

<script lang="ts">
export default {
    name: 'ModuleItem'
}
</script>
