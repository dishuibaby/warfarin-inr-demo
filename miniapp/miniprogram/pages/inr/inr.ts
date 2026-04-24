import type { InrRecord, InrRecordsResponse, InrTargetRange, InrTrendPoint } from '../../types/api';
import { classifyInr, inrTierPrompt } from '../../utils/inr';
import { request } from '../../utils/request';

interface CurvePoint {
  date: string;
  value: number;
}

interface InrPageData {
  rawCurve: CurvePoint[];
  correctedCurve: CurvePoint[];
  latestPrompt: string;
  records: InrRecord[];
  targetText: string;
}

interface InrPageThis {
  setData(data: Partial<InrPageData>): void;
  loadInrRecords(): Promise<void>;
  applyResponse(response: InrRecordsResponse): void;
}

const targetRange: InrTargetRange = { min: 2, max: 3 };
const mockTrend: InrTrendPoint[] = [
  { date: '04-03', rawInr: 2.1, correctedInr: 2.16 },
  { date: '04-10', rawInr: 2.4, correctedInr: 2.46 },
  { date: '04-17', rawInr: 3.08, correctedInr: 3.14 },
  { date: '04-24', rawInr: 2.36, correctedInr: 2.42 }
];

function makeMockRecords(): InrRecord[] {
  return mockTrend.map((point, index) => ({
    id: `demo-${index}`,
    testedAt: point.date,
    rawInr: point.rawInr,
    correctedInr: point.correctedInr,
    method: index % 2 === 0 ? 'venous' : 'fingerstick',
    tier: classifyInr(point.correctedInr, targetRange)
  }));
}

Page({
  data: {
    rawCurve: [],
    correctedCurve: [],
    latestPrompt: '暂无 INR 记录',
    records: [],
    targetText: '目标范围 2.0 - 3.0'
  } as InrPageData,

  onLoad(this: InrPageThis) {
    this.loadInrRecords();
  },

  async loadInrRecords(this: InrPageThis) {
    try {
      const response = await request<InrRecordsResponse>('/inr/records');
      this.applyResponse(response);
    } catch (_error) {
      this.applyResponse({
        records: makeMockRecords(),
        trend: mockTrend,
        targetRange
      });
    }
  },

  applyResponse(this: InrPageThis, response: InrRecordsResponse) {
    const latest = response.records[0] ?? null;
    this.setData({
      rawCurve: response.trend.map((point) => ({ date: point.date, value: point.rawInr })),
      correctedCurve: response.trend.map((point) => ({ date: point.date, value: point.correctedInr })),
      latestPrompt: latest ? inrTierPrompt(latest.tier) : '暂无 INR 记录',
      records: response.records,
      targetText: `目标范围 ${response.targetRange.min.toFixed(1)} - ${response.targetRange.max.toFixed(1)}`
    });
  }
});
