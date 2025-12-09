<template>
  <div class="h-auto flex flex-col">
    <draggable 
      v-model="store.modules" 
      :group="{ name: 'g1' }"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-50"
      class="pb-4 min-h-[50px]" 
    >
      <template #item="{ element, index }">
        <ModuleItem 
            :module="element" 
            @delete="store.modules.splice(index, 1)"
        />
      </template>
      <template #footer>
          <div v-if="store.modules.length === 0" class="text-center text-gray-400 mt-10 mb-4">
              <p>暂无模块</p>
              <p class="text-xs mt-2">点击下方按钮添加</p>
          </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { usePromptStore } from '@/stores/promptStore';
import draggable from 'vuedraggable';
import ModuleItem from './ModuleItem.vue';

const store = usePromptStore();
</script>

