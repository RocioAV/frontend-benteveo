export const MS_PER_DAY = 1000 * 60 * 60 * 24

export function rentalDays(start, end) {
  return Math.max(1, Math.ceil((end - start) / MS_PER_DAY))
}
