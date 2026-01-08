import type { Transaction } from './transaction';

import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export interface ReportSummary {
  period: string;
  total_expense: number;
  total_income: number;
  net_amount: number;
  by_source: SourceSummary[];
  match_summary: MatchSummary;
  by_month?: MonthSummary[];
}

export interface SourceSummary {
  source: string;
  expense: number;
  income: number;
  count: number;
}

export interface MatchSummary {
  total_count: number;
  matched_count: number;
  unmatched_count: number;
  match_rate: number;
}

export interface MonthSummary {
  month: string;
  expense: number;
  income: number;
  count: number;
}

export interface SystemStats {
  total_bills: number;
  total_transactions: number;
  total_matches: number;
  total_reconcile_runs: number;
  by_source: Record<string, number>;
  by_status: Record<string, number>;
}

export interface CategoryStats {
  category: string;
  expense: number;
  income: number;
  count: number;
  percentage: number;
}

export interface MatchRateStats {
  period: string;
  match_rate: number;
  matched_count: number;
  total_count: number;
}

export interface MonthlyStats {
  month: string;
  expense: number;
  income: number;
  net: number;
  count: number;
}

export interface SourceStats {
  source: string;
  expense: number;
  income: number;
  count: number;
  percentage: number;
}

export interface ExportParams {
  statement_month?: string;
  format?: 'csv' | 'excel';
  include_unmatched?: boolean;
}

export interface ExportInfo {
  filename: string;
  size: number;
  created_time: string;
  download_url: string;
}

/**
 * 获取报表汇总
 */
export async function getReportSummaryApi(params?: {
  statement_month?: string;
}) {
  return requestClient.get<ReportSummary>('/api/v1/detective/reports/summary', {
    params,
  });
}

/**
 * 获取系统统计
 */
export async function getSystemStatsApi() {
  return requestClient.get<SystemStats>('/api/v1/detective/reports/stats');
}

/**
 * 获取未匹配交易列表
 */
export async function getUnmatchedListApi(params?: {
  page?: number;
  size?: number;
}) {
  return requestClient.get<PaginationResult<Transaction>>(
    '/api/v1/detective/reports/unmatched',
    { params },
  );
}

/**
 * 导出报表
 */
export async function exportReportApi(params: ExportParams) {
  return requestClient.post<Blob>('/api/v1/detective/reports/export', params, {
    responseType: 'blob',
  });
}

/**
 * 获取导出信息
 */
export async function getExportInfoApi(params?: { statement_month?: string }) {
  return requestClient.get<ExportInfo>(
    '/api/v1/detective/reports/export/info',
    { params },
  );
}

/**
 * 获取分类统计
 */
export async function getCategoryStatsApi(params?: {
  statement_month?: string;
}) {
  return requestClient.get<CategoryStats[]>(
    '/api/v1/detective/stats/category',
    { params },
  );
}

/**
 * 获取匹配率统计
 */
export async function getMatchRateStatsApi(params?: { months?: number }) {
  return requestClient.get<MatchRateStats[]>(
    '/api/v1/detective/stats/match-rate',
    { params },
  );
}

/**
 * 获取月度统计
 */
export async function getMonthlyStatsApi(params?: { months?: number }) {
  return requestClient.get<MonthlyStats[]>('/api/v1/detective/stats/monthly', {
    params,
  });
}

/**
 * 获取月度趋势统计（用于图表）
 */
export async function getMonthlyTrendApi(params?: { months?: number }) {
  return requestClient.get<MonthlyStats[]>(
    '/api/v1/detective/stats/monthly-trend',
    { params },
  );
}

/**
 * 获取来源统计
 */
export async function getSourceStatsApi(params?: { statement_month?: string }) {
  return requestClient.get<SourceStats[]>('/api/v1/detective/stats/source', {
    params,
  });
}
