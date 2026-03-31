import {
  createProject as createProjectApi,
  getProject,
  listProjects,
} from '@shared/api/crmV1Service'
import { isApiError } from '@shared/api/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mapApiProjectToProject } from './lib/mapApiProject'
import { projectUiToCreateBody } from './lib/projectToApi'
import type { Project } from './types'

export const projectsQueryKey = ['projects'] as const

export const projectDetailQueryKey = (projectId: string) => ['project', projectId] as const

export async function fetchProjects(): Promise<Project[]> {
  const { items } = await listProjects()
  return items.map(mapApiProjectToProject)
}

export async function fetchProjectById(projectId: string): Promise<Project | null> {
  try {
    const { project } = await getProject(projectId)
    return mapApiProjectToProject(project)
  } catch (e) {
    if (isApiError(e) && e.status === 404) {
      return null
    }
    throw e
  }
}

export const useProjectsQuery = () =>
  useQuery({
    queryKey: projectsQueryKey,
    queryFn: fetchProjects,
  })

export const useProjectQuery = (projectId: string | undefined) =>
  useQuery({
    queryKey: projectDetailQueryKey(projectId ?? ''),
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  })

const createProjectRemote = async (project: Project): Promise<Project> => {
  const { project: row } = await createProjectApi(projectUiToCreateBody(project))
  return mapApiProjectToProject(row)
}

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProjectRemote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })
}
