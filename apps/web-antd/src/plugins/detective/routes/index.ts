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
        name: 'DetectiveBillList',
        path: '/detective/bill/list',
        component: () => import('../views/bill/index.vue'),
        meta: {
          title: $t('detective.bill.list'),
          icon: 'mdi:file-document-multiple-outline',
        },
      },
      {
        name: 'DetectiveBillDetails',
        path: '/detective/bill/details',
        component: () => import('../views/bill/details.vue'),
        meta: {
          title: $t('detective.bill.details'),
          icon: 'mdi:format-list-bulleted',
        },
      },
      {
        name: 'DetectiveCreditCard',
        path: '/detective/credit-card',
        redirect: '/detective/credit-card/list',
        meta: {
          title: $t('detective.creditCard.title'),
          icon: 'mdi:credit-card-outline',
        },
        children: [
          {
            name: 'DetectiveCreditCardList',
            path: '/detective/credit-card/list',
            component: () => import('../views/credit-card/index.vue'),
            meta: {
              title: $t('detective.creditCard.cardList'),
              hideInMenu: true,
              activePath: '/detective/credit-card',
            },
          },
          {
            name: 'DetectiveCreditCardBillDetail',
            path: '/detective/credit-card/bill-detail/:billId',
            component: () => import('../views/credit-card/detail.vue'),
            meta: {
              title: $t('detective.creditCard.billDetail'),
              hideInMenu: true,
              activePath: '/detective/credit-card',
            },
          },
          {
            name: 'DetectiveCreditCardBills',
            path: '/detective/credit-card/:bankCode/:cardLast4/bills',
            component: () => import('../views/credit-card/bills.vue'),
            meta: {
              title: $t('detective.creditCard.billHistory'),
              hideInMenu: true,
              activePath: '/detective/credit-card',
            },
          },
        ],
      },
      {
        name: 'DetectiveTransaction',
        path: '/detective/transaction',
        component: () => import('../views/transaction/index.vue'),
        meta: {
          title: $t('detective.transaction.title'),
          icon: 'mdi:swap-horizontal',
        },
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
        ],
      },
      {
        name: 'DetectiveLedger',
        path: '/detective/ledger',
        component: () => import('../views/ledger/index.vue'),
        meta: {
          title: $t('detective.ledger.title'),
          icon: 'mdi:book-open-page-variant',
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
        name: 'DetectiveReport',
        path: '/detective/report',
        redirect: '/detective/report/summary',
        meta: {
          title: $t('detective.report.title'),
          icon: 'mdi:chart-bar',
        },
        children: [
          {
            name: 'DetectiveReportSummary',
            path: '/detective/report/summary',
            component: () => import('../views/report/summary.vue'),
            meta: {
              title: $t('detective.report.summary'),
              icon: 'mdi:file-chart',
            },
          },
          {
            name: 'DetectiveReportUnmatched',
            path: '/detective/report/unmatched',
            component: () => import('../views/report/unmatched.vue'),
            meta: {
              title: $t('detective.report.unmatched'),
              icon: 'mdi:link-off',
            },
          },
        ],
      },
    ],
  },
];

export default routes;
