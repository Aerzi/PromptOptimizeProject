<template>
  <div class="flex h-screen w-full bg-background text-gray-900 font-sans overflow-hidden">
    <!-- Left: Input -->
    <div class="flex-1 border-r border-gray-200 flex flex-col min-w-0">
      <header class="h-12 border-b border-gray-200 flex items-center px-4 bg-white/50 backdrop-blur-sm">
        <h2 class="font-medium text-sm text-gray-500 uppercase tracking-wide">原始输入</h2>
      </header>
      <div class="flex-1 overflow-hidden relative">
        <slot name="input"></slot>
      </div>
    </div>

    <!-- Center: Modules -->
    <div class="flex-[2] border-r border-gray-200 flex flex-col min-w-0 bg-gray-50/50">
      <header class="h-12 border-b border-gray-200 flex items-center px-4 bg-white/50 backdrop-blur-sm justify-between">
        <h2 class="font-medium text-sm text-gray-500 uppercase tracking-wide">模块化编辑</h2>
        <div class="flex gap-2 text-xs text-gray-400 items-center">
             <slot name="modules-header-actions"></slot>
             <div class="h-4 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <span>拖拽排序</span>
            <span>•</span>
            <span>点击编辑</span>
        </div>
      </header>
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar h-full">
        <slot name="modules"></slot>
      </div>
    </div>

    <!-- Right: Preview -->
    <div class="flex-1 flex flex-col min-w-0 bg-white">
      <header class="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm">
        <h2 class="font-medium text-sm text-gray-500 uppercase tracking-wide">预览与导出</h2>
        <slot name="preview-header-actions"></slot>
      </header>
      <div class="flex-1 overflow-hidden flex flex-col">
        <slot name="preview"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

