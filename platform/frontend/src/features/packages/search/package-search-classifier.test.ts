import { describe, it, expect } from 'vitest';
import { classifyQuery } from './package-search-classifier';

describe('package-search-classifier', () => {
  it('classifies public package IDs correctly', () => {
    const q1 = classifyQuery('PD-8K42Q');
    expect(q1.type).toBe('PUBLIC_PACKAGE_ID');
    expect(q1.normalized).toBe('PD-8K42Q');

    const q2 = classifyQuery('pd-8k42q');
    expect(q2.type).toBe('PUBLIC_PACKAGE_ID');
    expect(q2.normalized).toBe('PD-8K42Q');

    const q3 = classifyQuery('  pd-abc12  ');
    expect(q3.type).toBe('PUBLIC_PACKAGE_ID');
    expect(q3.normalized).toBe('PD-ABC12');
  });

  it('classifies pickup codes with safe alphabet correctly', () => {
    const q1 = classifyQuery('7K4P2MX');
    expect(q1.type).toBe('PICKUP_CODE');
    expect(q1.normalized).toBe('7K4P2MX');

    const q2 = classifyQuery('7k4p2mx');
    expect(q2.type).toBe('PICKUP_CODE');
    expect(q2.normalized).toBe('7K4P2MX');

    // Handles accidental spaces between letters
    const q3 = classifyQuery('7 K 4 P 2 M X');
    expect(q3.type).toBe('PICKUP_CODE');
    expect(q3.normalized).toBe('7K4P2MX');
  });

  it('does NOT classify excluded ambiguous characters as pickup code', () => {
    // Contains 'O' and '0' and 'I' which are excluded from safe alphabet
    const q = classifyQuery('7O4P2IX');
    // Because 'O' and 'I' are not in safe alphabet, it falls through to NAME_OR_TEXT
    expect(q.type).toBe('NAME_OR_TEXT');
  });

  it('classifies phone numbers correctly', () => {
    const q1 = classifyQuery('08031234567');
    expect(q1.type).toBe('PHONE');
    expect(q1.phoneNormalized).toBe('+2348031234567');

    const q2 = classifyQuery('0803 123 4567');
    expect(q2.type).toBe('PHONE');
    expect(q2.phoneNormalized).toBe('+2348031234567');

    const q3 = classifyQuery('+2348031234567');
    expect(q3.type).toBe('PHONE');
    expect(q3.phoneNormalized).toBe('+2348031234567');

    const q4 = classifyQuery('2348031234567');
    expect(q4.type).toBe('PHONE');
    expect(q4.phoneNormalized).toBe('+2348031234567');
  });

  it('classifies customer names and general text correctly', () => {
    const q1 = classifyQuery('Chinedu');
    expect(q1.type).toBe('NAME_OR_TEXT');
    expect(q1.normalized).toBe('chinedu');
    expect(q1.tokens).toEqual(['chinedu']);

    const q2 = classifyQuery('Chinedu Okafor');
    expect(q2.type).toBe('NAME_OR_TEXT');
    expect(q2.normalized).toBe('chinedu okafor');
    expect(q2.tokens).toEqual(['chinedu', 'okafor']);
  });

  it('classifies empty or whitespace queries correctly', () => {
    expect(classifyQuery('').type).toBe('EMPTY');
    expect(classifyQuery('   ').type).toBe('EMPTY');
  });
});
