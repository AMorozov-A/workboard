/** Публичный пользователь из API (без секретных полей). */
export type PublicUser = {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}
