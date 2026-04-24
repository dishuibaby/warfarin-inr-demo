import type { InrTestMethod, Settings, TestCycleUnit } from '../../types/api';
import { request } from '../../utils/request';

interface PickerOption<T extends string> {
  label: string;
  value: T;
}

interface SettingsPageData {
  settings: Settings;
  methodOptions: PickerOption<InrTestMethod>[];
  cycleOptions: PickerOption<TestCycleUnit>[];
  methodIndex: number;
  cycleIndex: number;
  offsetInput: string;
  cycleValueInput: string;
}

interface SettingsPageThis {
  data: SettingsPageData;
  setData(data: Partial<SettingsPageData>): void;
  loadSettings(): Promise<void>;
  applySettings(settings: Settings): void;
  saveSettings(settings: Settings): Promise<void>;
}

const methodOptions: PickerOption<InrTestMethod>[] = [
  { label: '静脉血检测', value: 'venous' },
  { label: '指尖血检测', value: 'fingerstick' },
  { label: '家用仪检测', value: 'home_meter' }
];

const cycleOptions: PickerOption<TestCycleUnit>[] = [
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
];

const defaultSettings: Settings = {
  testMethods: ['venous', 'fingerstick', 'home_meter'],
  defaultTestMethod: 'venous',
  inrOffset: 0,
  testCycle: { value: 1, unit: 'week' },
  targetRange: { min: 2, max: 3 }
};

Page({
  data: {
    settings: defaultSettings,
    methodOptions,
    cycleOptions,
    methodIndex: 0,
    cycleIndex: 1,
    offsetInput: '0',
    cycleValueInput: '1'
  } as SettingsPageData,

  onLoad(this: SettingsPageThis) {
    this.loadSettings();
  },

  async loadSettings(this: SettingsPageThis) {
    try {
      const settings = await request<Settings>('/settings');
      this.applySettings(settings);
    } catch (_error) {
      this.applySettings(defaultSettings);
    }
  },

  onMethodChange(this: SettingsPageThis, event: { detail: { value: string } }) {
    const methodIndex = Number(event.detail.value);
    const defaultTestMethod = this.data.methodOptions[methodIndex].value;
    this.applySettings({ ...this.data.settings, defaultTestMethod });
  },

  onCycleUnitChange(this: SettingsPageThis, event: { detail: { value: string } }) {
    const cycleIndex = Number(event.detail.value);
    const unit = this.data.cycleOptions[cycleIndex].value;
    this.applySettings({
      ...this.data.settings,
      testCycle: { ...this.data.settings.testCycle, unit }
    });
  },

  onOffsetInput(this: SettingsPageThis, event: { detail: { value: string } }) {
    this.setData({ offsetInput: event.detail.value });
  },

  onCycleValueInput(this: SettingsPageThis, event: { detail: { value: string } }) {
    this.setData({ cycleValueInput: event.detail.value });
  },

  onSave(this: SettingsPageThis) {
    const inrOffset = Number(this.data.offsetInput);
    const cycleValue = Number(this.data.cycleValueInput);

    if (!Number.isFinite(inrOffset) || !Number.isFinite(cycleValue) || cycleValue <= 0) {
      wx.showToast({ title: '请输入有效设置', icon: 'none' });
      return;
    }

    const settings: Settings = {
      ...this.data.settings,
      inrOffset,
      testCycle: {
        ...this.data.settings.testCycle,
        value: cycleValue
      }
    };

    void this.saveSettings(settings);
  },

  applySettings(this: SettingsPageThis, settings: Settings) {
    const methodIndex = methodOptions.findIndex((option) => option.value === settings.defaultTestMethod);
    const cycleIndex = cycleOptions.findIndex((option) => option.value === settings.testCycle.unit);

    this.setData({
      settings,
      methodIndex: Math.max(methodIndex, 0),
      cycleIndex: Math.max(cycleIndex, 0),
      offsetInput: String(settings.inrOffset),
      cycleValueInput: String(settings.testCycle.value)
    });
  },

  async saveSettings(this: SettingsPageThis, settings: Settings) {
    try {
      const saved = await request<Settings>('/settings', {
        method: 'PUT',
        data: settings
      });
      this.applySettings(saved);
    } catch (_error) {
      this.applySettings(settings);
    }

    wx.showToast({ title: '已保存', icon: 'success' });
  }
});
