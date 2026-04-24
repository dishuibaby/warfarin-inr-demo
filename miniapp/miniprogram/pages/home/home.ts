import type { HomeSummary } from '../../types/api';
import { request } from '../../utils/request';
import { inrTierPrompt } from '../../utils/inr';

type HomeViewModel = HomeSummary & {
  latestCorrectedDisplay: string;
  latestRawDisplay: string;
  inrPrompt: string;
};

interface HomePageData {
  loading: boolean;
  summary: HomeViewModel;
}

interface HomePageThis {
  setData(data: Partial<HomePageData>): void;
  loadSummary(): Promise<void>;
  applySummary(summary: HomeSummary): void;
}

const emptySummary: HomeViewModel = {
  latestInr: null,
  nextTestAt: '待设置',
  mustHaveReminder: '请按医嘱完成今日抗凝药记录',
  medicationCompletedToday: false,
  targetRange: { min: 2, max: 3 },
  latestCorrectedDisplay: '--',
  latestRawDisplay: '原始 INR --',
  inrPrompt: '暂无 INR 记录，请按计划检测后记录。'
};

const mockSummary: HomeSummary = {
  latestInr: {
    id: 'demo-inr-1',
    testedAt: '2026-04-24 08:30',
    rawInr: 2.36,
    correctedInr: 2.42,
    method: 'venous',
    tier: 'in_range'
  },
  nextTestAt: '2026-05-01 08:30',
  mustHaveReminder: '今晚 20:00 服药后请立即点击完成记录',
  medicationCompletedToday: false,
  targetRange: { min: 2, max: 3 }
};

Page({
  data: {
    loading: true,
    summary: emptySummary
  } as HomePageData,

  onLoad(this: HomePageThis) {
    this.loadSummary();
  },

  async loadSummary(this: HomePageThis) {
    try {
      const summary = await request<HomeSummary>('/home/summary');
      this.applySummary(summary);
    } catch (_error) {
      this.applySummary(mockSummary);
    }
  },

  applySummary(this: HomePageThis, summary: HomeSummary) {
    const latestInr = summary.latestInr;
    const viewModel: HomeViewModel = {
      ...summary,
      latestCorrectedDisplay: latestInr ? latestInr.correctedInr.toFixed(2) : '--',
      latestRawDisplay: latestInr ? `原始 INR ${latestInr.rawInr.toFixed(2)}` : '原始 INR --',
      inrPrompt: latestInr ? inrTierPrompt(latestInr.tier) : emptySummary.inrPrompt
    };

    this.setData({
      loading: false,
      summary: viewModel
    });
  }
});
