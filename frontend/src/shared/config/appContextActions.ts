export const APP_CONTEXT_ACTION_EVENT = 'crm:appContextAction'

export const APP_CONTEXT_ACTIONS = {
  projectsCreateProject: 'projects:createProject',
} as const

export type AppContextActionKey = (typeof APP_CONTEXT_ACTIONS)[keyof typeof APP_CONTEXT_ACTIONS]

