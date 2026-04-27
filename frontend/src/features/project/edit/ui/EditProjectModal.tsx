import type { Project } from '@entities/project/types'
import { ProjectModalWidget } from '@widgets/project/ProjectModalWidget'

type EditProjectModalProps = {
  project: Project | null
  open: boolean
  onClose: () => void
  onUpdate: (project: Project) => void | Promise<void>
}

export const EditProjectModal = (props: EditProjectModalProps) => (
  <ProjectModalWidget mode="edit" {...props} />
)
