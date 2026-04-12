import { App } from 'antd'
import { bindAntdAppApis } from '@shared/ui/notify'

export function AntdAppBridge() {
  const { message, notification } = App.useApp()
  bindAntdAppApis({ message, notification })
  return null
}
