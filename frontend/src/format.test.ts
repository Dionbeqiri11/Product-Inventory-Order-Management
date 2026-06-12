import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats integer cents as USD currency', () => {
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(1234)).toBe('$12.34');
    expect(formatPrice(100000)).toBe('$1,000.00');
  });
});
