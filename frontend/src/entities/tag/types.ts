export type TagColor = string

export type Tag = {
  id: string
  name: string
  color: TagColor
  createdAt: string
  updatedAt: string
}

export type CreateTagDto = {
  name: string
  color: TagColor
}

export type UpdateTagDto = Partial<CreateTagDto>

