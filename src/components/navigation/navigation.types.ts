export const navigationItems = [
  'Overview',
  'District Profile',
  'Evidence',
  'Data & Methodology',
] as const

export type NavigationItem = (typeof navigationItems)[number]