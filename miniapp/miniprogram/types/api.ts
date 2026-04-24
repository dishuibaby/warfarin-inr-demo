export type InrTestMethod = 'venous' | 'fingerstick' | 'home_meter';
export type TestCycleUnit = 'day' | 'week' | 'month';
export type TomorrowDoseMode = 'planned' | 'manual';
export type InrTier = 'in_range' | 'weak_low' | 'weak_high' | 'strong_low' | 'strong_high';

export interface InrTargetRange {
  min: number;
  max: number;
}

export interface InrRecord {
  id: string;
  testedAt: string;
  rawInr: number;
  correctedInr: number;
  method: InrTestMethod;
  tier: InrTier;
  note?: string;
}

export interface InrTrendPoint {
  date: string;
  rawInr: number;
  correctedInr: number;
}

export interface HomeSummary {
  latestInr: InrRecord | null;
  nextTestAt: string;
  mustHaveReminder: string;
  medicationCompletedToday: boolean;
  targetRange: InrTargetRange;
}

export interface TomorrowDoseSelection {
  mode: TomorrowDoseMode;
  plannedDoseMg?: number;
  manualDoseMg?: number;
}

export interface MedicationActionRequest {
  actionType: 'completed';
  tomorrowDose: TomorrowDoseSelection;
}

export interface MedicationRecord {
  id: string;
  actionType: 'completed';
  operationTime: string;
  tomorrowDose: TomorrowDoseSelection;
}

export interface Settings {
  testMethods: InrTestMethod[];
  defaultTestMethod: InrTestMethod;
  inrOffset: number;
  testCycle: {
    value: number;
    unit: TestCycleUnit;
  };
  targetRange: InrTargetRange;
}

export interface InrRecordsResponse {
  records: InrRecord[];
  trend: InrTrendPoint[];
  targetRange: InrTargetRange;
}
