export const IMPACT_CLASS = {
  critical: 'impact-critical',
  serious: 'impact-serious',
  moderate: 'impact-moderate',
  minor: 'impact-minor',
};

export function impactClass(impact) {
  return IMPACT_CLASS[impact] || 'impact-minor';
}

export const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

export function sortByImpact(violations) {
  return [...violations].sort(
    (a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9),
  );
}
