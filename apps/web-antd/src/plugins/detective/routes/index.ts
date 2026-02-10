import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'Detective',
    path: '/detective',
    meta: {
      title: $t('detective.title'),
      icon: 'mdi:magnify',
      order: 10,
    },
    children: [
      {
        name: 'DetectiveDashboard',
        path: '/detective/dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: {
          title: $t('detective.dashboard.title'),
          icon: 'mdi:view-dashboard',
        },
      },
      {
        name: 'DetectiveImport',
        path: '/detective/import',
        meta: {
          title: $t('detective.menu.import'),
          icon: 'mdi:import',
        },
        children: [
          {
            name: 'DetectiveBillList',
            path: '/detective/import/bills',
            component: () => import('../views/bill/index.vue'),
            meta: {
              title: $t('detective.bill.list'),
              icon: 'mdi:file-document-outline',
            },
          },
          {
            name: 'DetectiveBillDetails',
            path: '/detective/import/bills/details',
            component: () => import('../views/bill/details.vue'),
            meta: {
              title: $t('detective.bill.details'),
              icon: 'mdi:format-list-bulleted',
            },
          },
          {
            name: 'DetectiveBillDetail',
            path: '/detective/import/bills/detail/:id',
            component: () => import('../views/bill/detail.vue'),
            meta: {
              title: $t('detective.transaction.detail'),
              hideInMenu: true,
              activePath: '/detective/import/bills/details',
            },
          },
          {
            name: 'DetectiveCreditCardList',
            path: '/detective/import/credit-cards',
            component: () => import('../views/credit-card/index.vue'),
            meta: {
              title: $t('detective.creditCard.cardList'),
              icon: 'mdi:credit-card-outline',
            },
          },
          {
            name: 'DetectiveCreditCardTransactions',
            path: '/detective/import/credit-cards/:cardId/transactions',
            component: () => import('../views/credit-card/transactions.vue'),
            meta: {
              title: $t('detective.creditCard.cardTransactions'),
              hideInMenu: true,
              activePath: '/detective/import/credit-cards',
            },
          },
        ],
      },
      {
        name: 'DetectiveTransaction',
        path: '/detective/transactions',
        component: () => import('../views/transaction/index.vue'),
        meta: {
          title: $t('detective.transaction.title'),
          icon: 'mdi:swap-horizontal',
        },
      },
      {
        name: 'DetectiveReconcile',
        path: '/detective/reconcile',
        redirect: '/detective/reconcile/runs',
        meta: {
          title: $t('detective.reconcile.title'),
          icon: 'mdi:check-decagram',
        },
        children: [
          {
            name: 'DetectiveReconcileRuns',
            path: '/detective/reconcile/runs',
            component: () => import('../views/reconcile/runs.vue'),
            meta: {
              title: $t('detective.reconcile.runs'),
              icon: 'mdi:history',
            },
          },
          {
            name: 'DetectiveReconcileRunDetail',
            path: '/detective/reconcile/runs/:id',
            component: () => import('../views/reconcile/RunDetail.vue'),
            meta: {
              title: $t('detective.reconcile.runDetail'),
              hideInMenu: true,
              activePath: '/detective/reconcile/runs',
            },
          },
          {
            name: 'DetectiveReconcileMatches',
            path: '/detective/reconcile/matches',
            component: () => import('../views/reconcile/matches.vue'),
            meta: {
              title: $t('detective.reconcile.matches'),
              icon: 'mdi:link-variant',
            },
          },
        ],
      },
      {
        name: 'DetectiveCashOut',
        path: '/detective/cash-out',
        redirect: '/detective/cash-out/merchants',
        meta: {
          title: $t('detective.cashOut.title'),
          icon: 'ant-design:money-collect-outlined',
        },
        children: [
          {
            name: 'DetectiveCashOutMerchants',
            path: '/detective/cash-out/merchants',
            component: () => import('../views/cash-out/index.vue'),
            meta: {
              title: $t('detective.cashOut.merchantList'),
              icon: 'mdi:store',
            },
          },
          {
            name: 'DetectiveCashOutGroups',
            path: '/detective/cash-out/groups',
            component: () => import('../views/cash-out/groups/index.vue'),
            meta: {
              title: $t('detective.merchantGroup.title'),
              icon: 'mdi:folder-multiple',
            },
          },
          {
            name: 'DetectiveCashOutGroupDetail',
            path: '/detective/cash-out/groups/:groupId',
            component: () => import('../views/cash-out/groups/detail.vue'),
            meta: {
              title: $t('detective.merchantGroup.groupDetail'),
              hideInMenu: true,
              activePath: '/detective/cash-out/groups',
            },
          },
        ],
      },
      {
        name: 'DetectiveAnalysis',
        path: '/detective/analysis',
        meta: {
          title: $t('detective.menu.analysis'),
          icon: 'mdi:chart-bar',
        },
        children: [
          {
            name: 'DetectiveReportSummary',
            path: '/detective/analysis/summary',
            component: () => import('../views/report/summary.vue'),
            meta: {
              title: $t('detective.report.summary'),
              icon: 'mdi:file-chart',
            },
          },
          {
            name: 'DetectiveLedger',
            path: '/detective/analysis/ledger',
            component: () => import('../views/ledger/index.vue'),
            meta: {
              title: $t('detective.ledger.title'),
              icon: 'mdi:book-open-page-variant',
            },
          },
          {
            name: 'DetectiveReportUnmatched',
            path: '/detective/analysis/unmatched',
            component: () => import('../views/report/unmatched.vue'),
            meta: {
              title: $t('detective.report.unmatched'),
              icon: 'mdi:link-off',
            },
          },
        ],
      },
      {
        name: 'DetectiveSettings',
        path: '/detective/settings',
        meta: {
          title: $t('detective.menu.settings'),
          icon: 'mdi:cog',
        },
        children: [
          {
            name: 'DetectiveSettingsAccounts',
            path: '/detective/settings/accounts',
            component: () => import('../views/settings/accounts.vue'),
            meta: {
              title: $t('detective.settings.accounts'),
              icon: 'mdi:bank-outline',
            },
          },
          {
            name: 'DetectiveSettingsCategories',
            path: '/detective/settings/categories',
            component: () => import('../views/settings/categories.vue'),
            meta: {
              title: $t('detective.settings.categories'),
              icon: 'mdi:shape-outline',
            },
          },
          {
            name: 'DetectiveSettingsBudgets',
            path: '/detective/settings/budgets',
            component: () => import('../views/settings/budgets.vue'),
            meta: {
              title: $t('detective.settings.budgets'),
              icon: 'mdi:chart-pie',
            },
          },
        ],
      },
      {
        name: 'DetectiveRecurring',
        path: '/detective/recurring',
        meta: {
          title: $t('detective.menu.recurring'),
          icon: 'mdi:calendar-clock',
        },
        children: [
          {
            name: 'DetectiveRecurringList',
            path: '/detective/recurring/list',
            component: () => import('../views/recurring/list.vue'),
            meta: {
              title: $t('detective.recurring.list'),
              icon: 'mdi:calendar-multiselect',
            },
          },
          {
            name: 'DetectiveRecurringReminders',
            path: '/detective/recurring/reminders',
            component: () => import('../views/recurring/reminders.vue'),
            meta: {
              title: $t('detective.recurring.reminders'),
              icon: 'mdi:bell-outline',
            },
          },
        ],
      },
    ],
  },
];

export default routes;
