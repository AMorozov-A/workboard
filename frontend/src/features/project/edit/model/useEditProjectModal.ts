import type { Project } from '@entities/project/types'
import { useCallback, useState } from 'react'

export const useEditProjectModal = () => {
  const [project, setProject] = useState<Project | null>(null)

  const openModal = useCallback((p: Project) => {
    setProject(p)
  }, [])

  const closeModal = useCallback(() => {
    setProject(null)
  }, [])

  return {
    projectToEdit: project,
    isOpen: project !== null,
    openModal,
    closeModal,
  }
}
