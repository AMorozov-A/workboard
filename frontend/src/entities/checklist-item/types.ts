export type ChecklistItem = {
  id: string
  taskId: string
  text: string
  done: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export type CreateChecklistItemDto = {
  text: string
}

export type UpdateChecklistItemDto = Partial<{
  text: string
  done: boolean
  position: number
}>

