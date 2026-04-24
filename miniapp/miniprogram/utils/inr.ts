import type { InrTargetRange, InrTier } from '../types/api';

const weakBand = 0.1;

export function classifyInr(correctedInr: number, targetRange: InrTargetRange): InrTier {
  if (correctedInr >= targetRange.min && correctedInr <= targetRange.max) {
    return 'in_range';
  }

  if (correctedInr < targetRange.min && correctedInr >= targetRange.min - weakBand) {
    return 'weak_low';
  }

  if (correctedInr > targetRange.max && correctedInr <= targetRange.max + weakBand) {
    return 'weak_high';
  }

  return correctedInr < targetRange.min ? 'strong_low' : 'strong_high';
}

export function inrTierPrompt(tier: InrTier): string {
  const prompts: Record<InrTier, string> = {
    in_range: '校正后 INR 在目标范围内，请继续按医嘱记录与复查。',
    weak_low: '校正后 INR 略低于目标范围 0.1 以内，请留意趋势并按计划复查。',
    weak_high: '校正后 INR 略高于目标范围 0.1 以内，请留意趋势并按计划复查。',
    strong_low: '校正后 INR 明显低于目标范围，请联系医生或抗凝门诊确认处理。',
    strong_high: '校正后 INR 明显高于目标范围，请联系医生或抗凝门诊确认处理。'
  };

  return prompts[tier];
}
