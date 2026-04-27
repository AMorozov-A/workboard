import type { Project } from '@entities/project/types'
import { useState } from 'react'

export const useEditProjectModal = () => {
  const [project, setProject] = useState<Project | null>(null)

  const openModal = (p: Project) => {
    setProject(p)
  }

  const closeModal = () => {
    setProject(null)
  }

  return {
    projectToEdit: project,
    isOpen: project !== null,
    openModal,
    closeModal,
  }
}
