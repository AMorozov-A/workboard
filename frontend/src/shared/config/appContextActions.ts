export const APP_CONTEXT_ACTION_EVENT = 'crm:appContextAction'

export const APP_CONTEXT_ACTIONS = {
  projectsCreateProject: 'projects:createProject',
  projectCreateTask: 'project:createTask',
  projectViewKanban: 'project:view:kanban',
  projectViewTable: 'project:view:table',
} as const

export type AppContextActionKey = (typeof APP_CONTEXT_ACTIONS)[keyof typeof APP_CONTEXT_ACTIONS]

