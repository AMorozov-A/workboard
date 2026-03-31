import { message, notification } from 'antd'

let isConfigured = false

export const initNotifications = () => {
  if (isConfigured) return

  message.config({ maxCount: 3, duration: 3 })
  notification.config({ placement: 'topRight', duration: 4 })

  isConfigured = true
}

export const notifySuccess = (title: string, description?: string) =>
  notification.success({ message: title, description })

export const notifyError = (title: string, description?: string) =>
  notification.error({ message: title, description })

export const showErrorMessage = (content: string) => message.error(content)
