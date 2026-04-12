import type { KeyboardEvent } from 'react'
import type { FieldValues, SubmitHandler, UseFormHandleSubmit } from 'react-hook-form'

export function rhfAntdOnFinish<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
  onValid: SubmitHandler<T>
) {
  return () => {
    void handleSubmit(onValid)()
  }
}

export function textAreaCtrlEnterSubmit<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
  onValid: SubmitHandler<T>
) {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || (!e.ctrlKey && !e.metaKey)) return
    e.preventDefault()
    void handleSubmit(onValid)()
  }
}

export function commentTextAreaCtrlEnter(submit: () => void, canSubmit: boolean) {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || (!e.ctrlKey && !e.metaKey)) return
    e.preventDefault()
    if (canSubmit) submit()
  }
}
