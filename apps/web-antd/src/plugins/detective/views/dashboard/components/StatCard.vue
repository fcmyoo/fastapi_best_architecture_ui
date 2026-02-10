<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  loading?: boolean;
  valueColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  prefix: '',
  suffix: '',
  precision: 0,
  loading: false,
  valueColor: 'text-gray-900',
  iconBgColor: 'bg-indigo-50',
  iconColor: 'text-indigo-500',
  trend: 'neutral',
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toFixed(props.precision);
  }
  return props.value;
});
</script>

<template>
  <div
    class="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/50"
  >
    <!-- 顶部：图标与标题 -->
    <div class="mb-4 flex items-start justify-between">
      <div class="flex flex-col gap-1">
        <span
          class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
        >
          {{ title }}
        </span>
      </div>
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-colors group-hover:bg-white"
        :class="[iconBgColor, iconColor]"
      >
        <slot name="icon"></slot>
      </div>
    </div>

    <!-- 底部：数值 -->
    <div class="flex items-baseline gap-1">
      <span v-if="prefix" class="text-sm font-bold text-gray-400">
        {{ prefix }}
      </span>
      <span
        class="font-mono text-2xl font-black tracking-tight"
        :class="valueColor"
      >
        {{ formattedValue }}
      </span>
      <span v-if="suffix" class="text-xs font-bold text-gray-400">
        {{ suffix }}
      </span>
    </div>

    <!-- 装饰性背景水印 -->
    <div
      class="pointer-events-none absolute -bottom-4 -right-4 opacity-[0.03] transition-transform duration-500 group-hover:scale-110"
    >
      <slot name="icon" class="h-32 w-32"></slot>
    </div>
  </div>
</template>
