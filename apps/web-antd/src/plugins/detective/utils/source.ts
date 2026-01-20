import { $t } from '#/locales';

/** 来源颜色映射 */
export const getSourceDotClass = (source: string) => {
  const classes: Record<string, string> = {
    wechat: 'bg-green-500',
    alipay: 'bg-blue-500',
    bank: 'bg-orange-500',
    credit_card: 'bg-purple-500',
  };
  return classes[source] || 'bg-gray-400';
};

/** 获取来源显示名称 */
export const getSourceDisplayName = (source: string, cardBank?: string) => {
  if (source === 'wechat') return $t('detective.bill.sourceOptions.wechat');
  if (source === 'alipay') return $t('detective.bill.sourceOptions.alipay');
  return cardBank || $t(`detective.bill.sourceOptions.${source}`);
};

/** 匹配状态颜色 */
export const getMatchStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    confirmed: 'green',
    rejected: 'red',
  };
  return colors[status || ''] || 'default';
};

/** 格式化时间显示（双行：日期 + 时间） */
export const formatTimeDisplay = (time: string) => {
  if (!time) return { date: '-', time: '' };
  const date = time.slice(0, 10);
  const timeStr = time.slice(11, 19);
  return {
    date,
    time: timeStr === '00:00:00' ? '' : timeStr,
  };
};

/** 格式化时间（单行） */
export const formatTime = (time?: string) => {
  if (!time) return '-';
  return time.replace('T', ' ');
};
