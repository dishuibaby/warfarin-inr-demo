import { classifyInr, inrTierPrompt } from '../miniprogram/utils/inr';
import type { InrTargetRange, InrTier } from '../miniprogram/types/api';

const targetRange: InrTargetRange = { min: 1.8, max: 2.5 };

type Case = {
  name: string;
  value: number;
  expected: InrTier;
};

const cases: Case[] = [
  { name: 'lower boundary is normal', value: 1.8, expected: 'normal' },
  { name: 'upper boundary is normal', value: 2.5, expected: 'normal' },
  { name: '0.1 below target is weak low', value: 1.7, expected: 'weak_low' },
  { name: 'more than 0.1 below target is strong low', value: 1.69, expected: 'strong_low' },
  { name: '0.1 above target is weak high', value: 2.6, expected: 'weak_high' },
  { name: 'more than 0.1 above target is strong high', value: 2.61, expected: 'strong_high' }
];

for (const item of cases) {
  const actual = classifyInr(item.value, targetRange);
  assertEqual(actual, item.expected, item.name);
}

assertIncludes(inrTierPrompt('weak_high'), '略高于目标范围 0.1 以内', 'weak high should use weak prompt');
assertIncludes(inrTierPrompt('strong_low'), '明显低于目标范围', 'strong low should use strong prompt');

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertIncludes(actual: string, expectedFragment: string, message: string): void {
  if (!actual.includes(expectedFragment)) {
    throw new Error(`${message}: expected ${actual} to include ${expectedFragment}`);
  }
}
