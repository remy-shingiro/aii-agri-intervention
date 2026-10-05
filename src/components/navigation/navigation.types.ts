export const navigationItems = [
  'Overview',
  'District Profile',
] as const

export type NavigationItem = (typeof navigationItems)[number]
