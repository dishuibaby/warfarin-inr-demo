import type { MedicationActionRequest, MedicationRecord, TomorrowDoseSelection } from '../../types/api';
import { request } from '../../utils/request';

interface MedicationPageData {
  completedToday: boolean;
  lastOperationTime: string;
  tomorrowDoseText: string;
}

interface MedicationPageThis {
  data: MedicationPageData;
  setData(data: Partial<MedicationPageData>): void;
  submitCompletion(selection: TomorrowDoseSelection): Promise<void>;
}

function formatDoseSelection(selection: TomorrowDoseSelection): string {
  if (selection.mode === 'planned') {
    return '明日剂量：按计划';
  }

  return `明日剂量：手动 ${selection.manualDoseMg ?? 0} mg`;
}

function nowDisplay(): string {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

Page({
  data: {
    completedToday: false,
    lastOperationTime: '尚未记录',
    tomorrowDoseText: '完成服药后选择明日剂量模式'
  } as MedicationPageData,

  onCompleteMedication(this: MedicationPageThis) {
    wx.showModal({
      title: '选择明日剂量模式',
      content: '服药完成后，请选择明日剂量按既定计划，或手动输入。系统只记录操作时间，不提供剂量建议。',
      confirmText: '按计划',
      cancelText: '手动输入',
      success: (result) => {
        if (result.confirm) {
          void this.submitCompletion({ mode: 'planned' });
          return;
        }

        wx.showModal({
          title: '手动输入明日剂量',
          content: '请输入医生已确认的明日剂量 mg。本页面不生成剂量建议。',
          editable: true,
          placeholderText: '例如 2.5',
          success: (manualResult) => {
            if (!manualResult.confirm) {
              return;
            }

            const manualDoseMg = Number(manualResult.content);
            if (!Number.isFinite(manualDoseMg) || manualDoseMg < 0) {
              wx.showToast({ title: '请输入有效剂量', icon: 'none' });
              return;
            }

            void this.submitCompletion({ mode: 'manual', manualDoseMg });
          }
        });
      }
    });
  },

  async submitCompletion(this: MedicationPageThis, selection: TomorrowDoseSelection) {
    const payload: MedicationActionRequest = {
      actionType: 'completed',
      tomorrowDose: selection
    };

    try {
      const record = await request<MedicationRecord>('/medication/records', {
        method: 'POST',
        data: payload
      });
      this.setData({
        completedToday: true,
        lastOperationTime: record.operationTime,
        tomorrowDoseText: formatDoseSelection(record.tomorrowDose)
      });
    } catch (_error) {
      this.setData({
        completedToday: true,
        lastOperationTime: nowDisplay(),
        tomorrowDoseText: formatDoseSelection(selection)
      });
    }

    wx.showToast({ title: '已记录完成', icon: 'success' });
  }
});
