import { useState, useCallback, useRef, useEffect } from 'react'

interface CopySuccessToastState {
  visible: boolean
  position: { x: number; y: number }
  copiedText: string
}

interface UseCopySuccessToastReturn {
  /** 提示状态 */
  toastState: CopySuccessToastState
  /** 显示复制成功提示 */
  showCopySuccess: (text: string, position?: { x: number; y: number }) => void
  /** 隐藏提示 */
  hideCopySuccess: () => void
}

/**
 * 复制成功提示管理 Hook / Copy success toast management hook
 *
 * 管理复制成功提示的显示状态和位置
 * Manages the display state and position of copy success toast
 */
export const useCopySuccessToast = (): UseCopySuccessToastReturn => {
  const [toastState, setToastState] = useState<CopySuccessToastState>({
    visible: false,
    position: { x: 0, y: 0 },
    copiedText: ''
  })

  // 记录最后的鼠标位置 / Record last mouse position
  const lastMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // 监听鼠标移动，记录位置 / Listen to mouse movement and record position
  const updateMousePosition = useCallback((event: MouseEvent) => {
    lastMousePositionRef.current = {
      x: event.clientX,
      y: event.clientY
    }
  }, [])

  // 显示复制成功提示 / Show copy success toast
  const showCopySuccess = useCallback((text: string, position?: { x: number; y: number }) => {
    const finalPosition = position || lastMousePositionRef.current

    setToastState({
      visible: true,
      position: finalPosition,
      copiedText: text
    })
  }, [])

  // 隐藏提示 / Hide toast
  const hideCopySuccess = useCallback(() => {
    setToastState((prev) => ({
      ...prev,
      visible: false
    }))
  }, [])

  // 初始化鼠标位置监听 / Initialize mouse position tracking
  useEffect(() => {
    document.addEventListener('mousemove', updateMousePosition, { passive: true })

    return () => {
      document.removeEventListener('mousemove', updateMousePosition)
    }
  }, [updateMousePosition])

  return {
    toastState,
    showCopySuccess,
    hideCopySuccess
  }
}
