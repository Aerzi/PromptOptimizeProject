<template>
  <div class="h-auto flex flex-col">
    <draggable 
      v-model="store.modules" 
      :group="{ name: 'g1' }"
      item-key="id"
      handle=".drag-handle"
      ghost-class="sortable-ghost"
      class="pb-4 min-h-[50px]" 
      @change="onDragChange"
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
import type { PromptModule } from '@/types/prompt';
import draggable from 'vuedraggable';
import ModuleItem from './ModuleItem.vue';

const store = usePromptStore();

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
        evt.added.element.level = 1;
        updateChildrenLevels(evt.added.element);
    }
};
</script>

