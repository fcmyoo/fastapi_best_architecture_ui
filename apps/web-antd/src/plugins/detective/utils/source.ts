import {
  AlipayOutlined,
  BankOutlined,
  CreditCardOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue';

import { $t } from '#/locales';

/** 来源颜色映射（圆点） */
export const getSourceDotClass = (source: string) => {
  const classes: Record<string, string> = {
    wechat: 'bg-green-500',
    alipay: 'bg-blue-500',
    bank: 'bg-orange-500',
    credit_card: 'bg-purple-500',
  };
  return classes[source] || 'bg-gray-400';
};

/** 来源颜色类（文字+背景） */
export const getSourceColorClass = (source: string) => {
  const colorMap: Record<string, string> = {
    alipay: 'text-blue-500 bg-blue-50',
    wechat: 'text-green-500 bg-green-50',
    bank: 'text-orange-500 bg-orange-50',
    credit_card: 'text-purple-500 bg-purple-50',
  };
  return colorMap[source] || 'text-gray-500 bg-gray-50';
};

/** 来源边框颜色类 */
export const getSourceBorderClass = (source: string) => {
  const colorMap: Record<string, string> = {
    alipay: 'border-blue-200',
    wechat: 'border-green-200',
    bank: 'border-orange-200',
    credit_card: 'border-purple-200',
  };
  return colorMap[source] || 'border-gray-200';
};

/** 来源图标组件 */
export const getSourceIcon = (source: string) => {
  const iconMap: Record<string, typeof BankOutlined> = {
    alipay: AlipayOutlined,
    wechat: WechatOutlined,
    bank: BankOutlined,
    credit_card: CreditCardOutlined,
  };
  return iconMap[source] || BankOutlined;
};

/** 获取来源显示名称 */
export const getSourceDisplayName = (
  source: string,
  cardBank?: null | string,
) => {
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
