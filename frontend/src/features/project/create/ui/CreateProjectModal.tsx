import { ProjectModalWidget } from '@widgets/project/ProjectModalWidget'
import type { Project } from '@entities/project/types'

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void | Promise<void>
}

export const CreateProjectModal = (props: CreateProjectModalProps) => (
  <ProjectModalWidget mode="create" {...props} />
)
