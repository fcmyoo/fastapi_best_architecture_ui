import type { EChartsOption } from './echarts';

import type { Ref } from 'vue';

import { onUnmounted, watch } from 'vue';

import echarts from './echarts';

type EChartsInstance = ReturnType<typeof echarts.init>;

/**
 * ECharts composable：封装 init / setOption / resize / dispose
 * @param elRef 图表容器的 ref
 */
export function useECharts(elRef: Ref<HTMLElement | null>) {
  let chartInstance: EChartsInstance | null = null;

  const initChart = () => {
    if (chartInstance || !elRef.value) return;
    chartInstance = echarts.init(elRef.value);
  };

  const setOption = (option: EChartsOption) => {
    initChart();
    chartInstance?.setOption(option);
  };

  const resize = () => {
    chartInstance?.resize();
  };

  const dispose = () => {
    chartInstance?.dispose();
    chartInstance = null;
  };

  const handleResize = () => resize();

  watch(
    elRef,
    (el) => {
      if (el) {
        window.addEventListener('resize', handleResize);
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    dispose();
  });

  return { dispose, resize, setOption };
}
