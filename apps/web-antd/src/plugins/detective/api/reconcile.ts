import type { Transaction } from './transaction';

import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export interface ReconcileRunStats {
  total_payment: number;
  total_debit: number;
  matched_count: number;
  auto_confirmed: number;
  pending: number;
  avg_confidence: number;
}

export interface ReconcileRun {
  id: number;
  statement_month: string;
  status: 'failed' | 'pending' | 'running' | 'success';
  is_active?: boolean;
  matched_count?: number;
  auto_confirmed?: number;
  pending?: number;
  total_payment?: number;
  total_debit?: number;
  stats?: ReconcileRunStats | string;
  error_message?: string;
  created_time: string;
  finished_time?: string;
}

export interface MatchTransactionBrief {
  id: number;
  source: string;
  transaction_time: string;
  amount: number;
  merchant_raw?: string;
  description?: string;
  card_bank?: string;
  card_last4?: string;
  direction?: string;
}

export interface RunMatchItem {
  id: number;
  confidence: number;
  status: 'confirmed' | 'pending' | 'rejected';
  confirmed_by?: number;
  payment_tx: MatchTransactionBrief;
  debit_tx: MatchTransactionBrief;
}

export interface RunMatchListParams {
  status?: string;
  page?: number;
  size?: number;
}

export interface ReconcileRunProgress {
  status: string;
  progress: number;
  current_step?: string;
  message?: string;
}

export interface MatchResult {
  id: number;
  run_id: number;
  payment_tx_id: number;
  debit_tx_id: number;
  confidence: number;
  score_detail?: Record<string, number>;
  status: 'confirmed' | 'pending' | 'rejected';
  reject_reason?: string;
  confirmed_by?: number;
  confirmed_time?: string;
  payment_tx?: Transaction;
  debit_tx?: Transaction;
  created_time: string;
  updated_time?: string;
}

export interface MatchListParams {
  run_id?: number;
  status?: string;
  min_confidence?: number;
  statement_month?: string;
  page?: number;
  size?: number;
}

export interface MatchExplain {
  time_score: number;
  time_diff_hours: number;
  amount_score: number;
  amount_diff: string;
  bank_card_score: number;
  channel_score: number;
  total_score: number;
  confidence: string;
  payment_card_bank?: string;
  payment_card_last4?: string;
  payment_card_type?: string;
  debit_card_bank?: string;
  debit_card_last4?: string;
  debit_card_type?: string;
}

/**
 * 执行对账
 */
export async function runReconcileApi(statementMonth: string) {
  return requestClient.post<ReconcileRun>('/api/v1/detective/reconcile/run', {
    statement_month: statementMonth,
  });
}

/**
 * 获取对账运行记录列表
 */
export async function getReconcileRunsApi(params?: {
  page?: number;
  size?: number;
}) {
  return requestClient.get<PaginationResult<ReconcileRun>>(
    '/api/v1/detective/reconcile/runs',
    { params },
  );
}

/**
 * 获取对账运行详情
 */
export async function getReconcileRunDetailApi(runId: number) {
  return requestClient.get<ReconcileRun>(
    `/api/v1/detective/reconcile/runs/${runId}`,
  );
}

/**
 * 获取某次运行的匹配结果列表
 */
export async function getRunMatchesApi(
  runId: number,
  params?: RunMatchListParams,
) {
  return requestClient.get<PaginationResult<RunMatchItem>>(
    `/api/v1/detective/reconcile/runs/${runId}/matches`,
    { params },
  );
}

/**
 * 获取对账运行进度
 */
export async function getReconcileRunProgressApi(runId: number) {
  return requestClient.get<ReconcileRunProgress>(
    `/api/v1/detective/reconcile/runs/${runId}/progress`,
  );
}

/**
 * 获取匹配结果列表
 */
export async function getMatchListApi(params?: MatchListParams) {
  return requestClient.get<PaginationResult<MatchResult>>(
    '/api/v1/detective/matches',
    { params },
  );
}

/**
 * 获取匹配详情
 */
export async function getMatchDetailApi(matchId: number) {
  return requestClient.get<MatchResult>(`/api/v1/detective/matches/${matchId}`);
}

/**
 * 确认匹配
 */
export async function confirmMatchApi(matchId: number) {
  return requestClient.post<MatchResult>(
    `/api/v1/detective/matches/${matchId}/confirm`,
  );
}

/**
 * 拒绝匹配
 */
export async function rejectMatchApi(matchId: number) {
  return requestClient.post<MatchResult>(
    `/api/v1/detective/matches/${matchId}/reject`,
  );
}

/**
 * 批量确认匹配
 */
export async function batchConfirmMatchesApi(matchIds: number[]) {
  return requestClient.post<{ updated_count: number }>(
    '/api/v1/detective/matches/batch-confirm',
    {
      match_ids: matchIds,
    },
  );
}

/**
 * 批量拒绝匹配
 */
export async function batchRejectMatchesApi(matchIds: number[]) {
  return requestClient.post<{ updated_count: number }>(
    '/api/v1/detective/matches/batch-reject',
    {
      match_ids: matchIds,
    },
  );
}

/**
 * 获取匹配解释
 */
export async function getMatchExplainApi(matchId: number) {
  return requestClient.get<MatchExplain>(
    `/api/v1/detective/matches/${matchId}/explain`,
  );
}

export interface ManualMatchParams {
  payment_tx_id: number;
  debit_tx_id: number;
}

/**
 * 手动匹配
 */
export async function manualMatchApi(params: ManualMatchParams) {
  return requestClient.post<MatchResult>(
    '/api/v1/detective/matches/manual',
    params,
  );
}

// 匹配候选相关类型
export interface ScoreDetail {
  time_score: number;
  amount_score: number;
  merchant_score: number;
  bank_card_score: number;
  channel_score: number;
}

// 已匹配交易的简要信息
export interface MatchedTransactionBrief {
  id: number;
  transaction_time: string;
  amount: string;
  merchant_raw?: string;
}

export interface MatchCandidate {
  transaction: Transaction;
  confidence: number;
  score_detail: ScoreDetail;
  matched_transaction?: MatchedTransactionBrief; // 当前匹配的交易信息
}

export interface MatchCandidatesResponse {
  source_transaction: Transaction;
  candidates: MatchCandidate[];
  total: number;
}

/**
 * 获取匹配候选
 */
export async function getMatchCandidatesApi(
  txId: number,
  matchCard: boolean = true,
) {
  return requestClient.get<MatchCandidatesResponse>(
    `/api/v1/detective/transactions/${txId}/match-candidates`,
    { params: { match_card: matchCard } },
  );
}
