import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { ChangePasswordForm } from './ChangePasswordForm'

type ChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('auth.changePassword.title')}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <ChangePasswordForm onSuccess={onClose} />
    </Modal>
  )
}
