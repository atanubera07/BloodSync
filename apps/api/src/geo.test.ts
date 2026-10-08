import { describe, expect, it } from 'vitest';
import { coarseCoordinate } from './geo';
describe('location privacy', () => {
  it('limits stored coordinates to two decimal places', () => {
    expect(coarseCoordinate(22.572645)).toBe(22.57);
    expect(coarseCoordinate(-88.36789)).toBe(-88.37);
    expect(coarseCoordinate(null)).toBeNull();
  });
});
