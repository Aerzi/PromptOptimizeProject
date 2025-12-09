<template>
  <MainLayout>
    <template #input>
      <PromptInput />
    </template>
    <template #modules-header-actions>
      <div class="flex items-center gap-1">
        <button 
          @click="store.undo()" 
          :disabled="!store.canUndo"
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="撤销"
        >
          <UndoIcon class="w-3.5 h-3.5" />
        </button>
        <button 
          @click="store.redo()" 
          :disabled="!store.canRedo"
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="重做"
        >
          <RedoIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </template>
    <template #modules>
      <ModuleList />
      <button 
        @click="store.addModule()"
        class="w-full py-2.5 mt-2 bg-white border border-gray-200 shadow-sm rounded-lg text-gray-700 hover:text-primary hover:border-primary/50 hover:bg-gray-50 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm group mb-8 cursor-pointer"
      >
        <div class="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <PlusIcon class="w-3.5 h-3.5 text-gray-500 group-hover:text-primary transition-colors" />
        </div>
        添加新模块
      </button>
    </template>
    <template #preview-header-actions>
      <button 
        @click="isDrawerOpen = true"
        class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded transition-colors cursor-pointer"
        title="查看大纲结构"
      >
        <ListTreeIcon class="w-4 h-4" />
      </button>
    </template>
    <template #preview>
      <PromptPreview />
    </template>
  </MainLayout>

  <StructureDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainLayout from './components/MainLayout.vue';
import PromptInput from './components/PromptInput.vue';
import ModuleList from './components/ModuleList.vue';
import PromptPreview from './components/PromptPreview.vue';
import StructureDrawer from './components/StructureDrawer.vue';
import { usePromptStore } from '@/stores/promptStore';
import { Plus as PlusIcon, ListTree as ListTreeIcon, Undo as UndoIcon, Redo as RedoIcon } from 'lucide-vue-next';

const store = usePromptStore();
const isDrawerOpen = ref(false);
</script>
