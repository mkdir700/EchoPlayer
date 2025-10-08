import {
  BORDER_RADIUS,
  GLASS_EFFECT,
  SPACING,
  Z_INDEX
} from '@renderer/infrastructure/styles/theme'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Volume, Volume1, Volume2, VolumeX } from 'lucide-react'
import { ReactNode } from 'react'
import styled from 'styled-components'

/**
 * 视频状态指示器类型
 */
export type VideoStatusType = 'loading' | 'volume' | 'custom'

/**
 * 视频状态指示器配置
 */
export interface VideoStatusConfig {
  /** 状态类型 */
  type: VideoStatusType
  /** 自定义图标（type 为 custom 时使用） */
  icon?: ReactNode
  /** 音量值（type 为 volume 时使用，0-100） */
  volume?: number
  /** 是否静音（type 为 volume 时使用） */
  muted?: boolean
}

interface VideoStatusIndicatorProps {
  /** 是否显示指示器 */
  show: boolean
  /** 状态配置 */
  config: VideoStatusConfig
  /** 是否显示卡片容器（默认 true，loading 类型默认 false） */
  showCard?: boolean
}

/**
 * 通用视频状态指示器组件
 * 支持多种状态展示：加载中、音量调节、自定义状态等
 */
function VideoStatusIndicator({ show, config, showCard }: VideoStatusIndicatorProps) {
  // loading 类型默认不显示卡片，其他类型默认显示
  const shouldShowCard = showCard ?? config.type !== 'loading'

  const renderIcon = () => {
    switch (config.type) {
      case 'loading':
        return (
          <SpinnerIcon
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <Loader2 size={40} strokeWidth={2} />
          </SpinnerIcon>
        )

      case 'volume': {
        const { volume = 0, muted = false } = config
        let VolumeIcon = Volume2

        if (muted || volume === 0) {
          VolumeIcon = VolumeX
        } else if (volume < 33) {
          VolumeIcon = Volume
        } else if (volume < 66) {
          VolumeIcon = Volume1
        }

        return (
          <IconContainer
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <VolumeIcon size={40} strokeWidth={2} />
          </IconContainer>
        )
      }

      case 'custom':
        return (
          <IconContainer
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {config.icon}
          </IconContainer>
        )

      default:
        return null
    }
  }

  const content = renderIcon()

  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {shouldShowCard ? (
            <StatusCard
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {content}
            </StatusCard>
          ) : (
            content
          )}
        </Overlay>
      )}
    </AnimatePresence>
  )
}

export default VideoStatusIndicator

// ==================== 样式组件 ====================

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: ${Z_INDEX.ELEVATED};
  pointer-events: none;
`

const StatusCard = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.LG}px;
  background: var(
    --ant-color-bg-elevated,
    rgba(28, 28, 30, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT})
  );
  border: 1px solid
    var(--ant-color-border-secondary, rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE}));
  border-radius: ${BORDER_RADIUS.LG}px;
  box-shadow: var(--ant-box-shadow-secondary, 0 4px 16px rgba(0, 0, 0, 0.2));
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.MEDIUM}px);
  -webkit-backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.MEDIUM}px);
`

const SpinnerIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ant-color-primary, #007aff);
`

const IconContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ant-color-text, #ffffff);
`
