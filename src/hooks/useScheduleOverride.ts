import { useState, useCallback } from 'react'
import { createScheduleOverride, deleteScheduleOverride } from '@/lib/data'
import { useToast } from '@/components/ToastProvider'

export interface UseScheduleOverrideOptions {
  /** 重新加载覆盖数据的回调函数 */
  onLoadOverrides: () => void
  /** 可选：关闭详情面板的回调函数 */
  onCloseDetail?: () => void
}

export function useScheduleOverride(options: UseScheduleOverrideOptions) {
  const { onLoadOverrides, onCloseDetail } = options
  const { showToast } = useToast()
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const handleOverrideAction = useCallback(async (
    scheduleId: string, dateStr: string, type: 'cancelled' | 'ended_early') => {
    if (type === 'cancelled') {
      setConfirmCancelId(scheduleId)
      return
    }
    const result = await createScheduleOverride({ schedule_id: scheduleId, date: dateStr, type })
    if (result) {
      showToast('已标记提前下课', 'success')
      onLoadOverrides()
    } else {
      showToast('操作失败，请稍后重试', 'error')
    }
  }, [onLoadOverrides, showToast])

  const handleConfirmCancel = useCallback(async (dateStr: string) => {
    if (!confirmCancelId) return
    const result = await createScheduleOverride({ 
      schedule_id: confirmCancelId, date: dateStr, type: 'cancelled' })
    setConfirmCancelId(null)
    if (result) {
      showToast('已取消本课', 'success')
      onLoadOverrides()
      onCloseDetail?.()
    } else {
      showToast('操作失败，请稍后重试', 'error')
    }
  }, [confirmCancelId, onLoadOverrides, onCloseDetail, showToast])

  const handleRevertOverride = useCallback(async (scheduleId: string, dateStr: string) => {
    const ok = await deleteScheduleOverride(scheduleId, dateStr)
    if (ok) {
      showToast('已恢复', 'success')
      onLoadOverrides()
    } else {
      showToast('操作失败，请稍后重试', 'error')
    }
  }, [onLoadOverrides, showToast])

  const cancelConfirmation = useCallback(() => {
    setConfirmCancelId(null)
  }, [])

  return {
    confirmCancelId,
    handleOverrideAction,
    handleConfirmCancel,
    handleRevertOverride,
    cancelConfirmation,
  }
}
