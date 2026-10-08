/** Round to about a kilometre of precision before persisting coordinates. */
export function coarseCoordinate(value: number | null | undefined) {
  return value == null ? null : Math.round(value * 100) / 100;
}
