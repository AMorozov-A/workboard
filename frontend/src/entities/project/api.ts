import {
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  getProject,
  listProjects,
  updateProject as updateProjectApi,
} from '@shared/api/crmV1Service'
import { isApiError } from '@shared/api/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mapApiProjectToProject } from './lib/mapApiProject'
import { projectUiToCreateBody, projectUiToUpdateBody } from './lib/projectToApi'
import type { Project } from './types'

export const projectsQueryKey = ['projects'] as const

export const projectDetailQueryKey = (projectId: string) => ['project', projectId] as const

export async function fetchProjects(): Promise<Project[]> {
  const { items } = await listProjects()
  const projects = items.map(mapApiProjectToProject)
  return [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
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
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project id is required for project query')
      }
      return fetchProjectById(projectId)
    },
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

const deleteProjectRemote = async (projectId: string): Promise<void> => {
  await deleteProjectApi(projectId)
}

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProjectRemote,
    onSuccess: (_, projectId) => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) })
    },
  })
}

type UpdateProjectParams = {
  projectId: string
  project: Project
}

const updateProjectRemote = async ({
  projectId,
  project,
}: UpdateProjectParams): Promise<Project> => {
  const { project: row } = await updateProjectApi(projectId, projectUiToUpdateBody(project))
  return mapApiProjectToProject(row)
}

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProjectRemote,
    onSuccess: (updated) => {
      queryClient.setQueryData(projectDetailQueryKey(updated.id), updated)
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(updated.id) })
    },
  })
}
