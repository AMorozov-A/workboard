import { App, message, notification } from 'antd'

type AppApis = ReturnType<typeof App.useApp>

let boundMessage: AppApis['message'] | null = null
let boundNotification: AppApis['notification'] | null = null

export function bindAntdAppApis(apis: Pick<AppApis, 'message' | 'notification'>) {
  boundMessage = apis.message
  boundNotification = apis.notification
}

let isConfigured = false

export const initNotifications = () => {
  if (isConfigured) return

  message.config({ maxCount: 3, duration: 3 })
  notification.config({ placement: 'topRight', duration: 4 })

  isConfigured = true
}

const getNotification = () => boundNotification ?? notification
const getMessage = () => boundMessage ?? message

export const notifySuccess = (title: string, description?: string) =>
  getNotification().success({ message: title, description, duration: 4, placement: 'topRight' })

export const notifyError = (title: string, description?: string) =>
  getNotification().error({ message: title, description, duration: 4, placement: 'topRight' })

export const showErrorMessage = (content: string) => getMessage().error(content)
