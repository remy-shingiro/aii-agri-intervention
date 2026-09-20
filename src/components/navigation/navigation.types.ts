export const navigationItems = [
  'Overview',
  'District profile',
  'Evidence',
  'Methodology',
] as const

export type NavigationItem = (typeof navigationItems)[number]