export const navigationItems = [
  'Overview',
  'District Profile',
  'Investigation Brief',
  'Evidence',
  'Data & Methodology',
] as const

export type NavigationItem = (typeof navigationItems)[number]
