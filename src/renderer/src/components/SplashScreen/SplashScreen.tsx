import { loggerService } from '@logger'
import React from 'react'
import styled, { css, keyframes } from 'styled-components'

const logger = loggerService.withContext('SplashScreen')

// 渐变动画关键帧，使用蓝色主题渐变
const gradientAnimation = keyframes`
  0% {
    --color-1: #1677ff;
    --color-2: #4096ff;
    --color-3: #69b1ff;
    --color-4: #91caff;
  }
  20% {
    --color-1: #4096ff;
    --color-2: #69b1ff;
    --color-3: #91caff;
    --color-4: #bae0ff;
  }
  40% {
    --color-1: #69b1ff;
    --color-2: #91caff;
    --color-3: #bae0ff;
    --color-4: #0958d9;
  }
  60% {
    --color-1: #91caff;
    --color-2: #bae0ff;
    --color-3: #0958d9;
    --color-4: #1677ff;
  }
  80% {
    --color-1: #bae0ff;
    --color-2: #0958d9;
    --color-3: #1677ff;
    --color-4: #4096ff;
  }
  100% {
    --color-1: #1677ff;
    --color-2: #4096ff;
    --color-3: #69b1ff;
    --color-4: #91caff;
  }
`

// 浅色主题下的渐变动画：采用更深更饱和的蓝色以提升对比度
const gradientAnimationLight = keyframes`
  /* 使用更明亮的蓝色区间以避免在浅色背景上显得偏暗 */
  0% {
    --color-1: #1677ff; /* blue-6 */
    --color-2: #4096ff; /* blue-5 */
    --color-3: #69b1ff; /* blue-4 */
    --color-4: #91caff; /* blue-3 */
  }
  20% {
    --color-1: #4096ff;
    --color-2: #69b1ff;
    --color-3: #91caff;
    --color-4: #bae0ff; /* blue-2 高亮过渡 */
  }
  40% {
    --color-1: #69b1ff;
    --color-2: #91caff;
    --color-3: #bae0ff;
    --color-4: #1677ff;
  }
  60% {
    --color-1: #91caff;
    --color-2: #bae0ff;
    --color-3: #1677ff;
    --color-4: #4096ff;
  }
  80% {
    --color-1: #bae0ff;
    --color-2: #1677ff;
    --color-3: #4096ff;
    --color-4: #69b1ff;
  }
  100% {
    --color-1: #1677ff;
    --color-2: #4096ff;
    --color-3: #69b1ff;
    --color-4: #91caff;
  }
`

// 打字机效果动画：字符从不可见到可见的渐现效果
const typewriterAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

// 优雅的退出动画：缩放 + 淡出 + 背景模糊
const smoothExitAnimation = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
    backdrop-filter: blur(0px);
  }
  60% {
    opacity: 0.6;
    transform: scale(1.015);
    backdrop-filter: blur(1.5px);
  }
  100% {
    opacity: 0;
    transform: scale(0.985);
    backdrop-filter: blur(3px);
  }
`

const SplashContainer = styled.div<{ $isVisible: boolean; $isExiting: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 使用应用的主题背景色，确保启动时立即遮盖底层内容且颜色一致 */
  background-color: var(--color-background);
  z-index: 10000;
  will-change: opacity, transform, backdrop-filter;

  /* 启动页应该立即显示，不应该有渐入动画导致闪现 */
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};

  ${({ $isVisible, $isExiting }) => {
    if (!$isVisible)
      return css`
        animation: none;
        pointer-events: none;
      `
    if ($isExiting)
      return css`
        animation: ${smoothExitAnimation} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        pointer-events: auto;
      `
    return css`
      /* 移除渐入动画，启动页应该立即显示 */
      animation: none;
      pointer-events: auto;
    `
  }}

  transition: none;

  /* 支持用户偏好的减少动效设置 */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;

    * {
      animation: none !important;
    }
  }
`

// Logo 退出动画：向上浮动并淡出
const logoExitAnimation = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.96);
  }
`

const LogoContainer = styled.div<{ $isExiting?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  will-change: opacity, transform;

  ${({ $isExiting }) =>
    $isExiting &&
    css`
      animation: ${logoExitAnimation} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `}

  /* 支持用户偏好的减少动效设置 */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const AnimatedLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(3.5rem, 9vw, 7rem);
  transform: rotate(-2deg);

  /* 支持用户偏好的减少动效设置 */
  @media (prefers-reduced-motion: reduce) {
    transform: rotate(-1deg);
  }
`

const AnimatedChar = styled.span<{ $delay: number }>`
  --color-1: #1677ff;
  --color-2: #4096ff;
  --color-3: #69b1ff;
  --color-4: #91caff;

  display: inline-block;
  background: linear-gradient(
    90deg,
    var(--color-1) 0%,
    var(--color-2) 36.59%,
    var(--color-3) 86.28%,
    var(--color-4) 100%
  );

  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  font-family:
    'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Segoe Script', 'Dancing Script',
    'Pacifico', cursive;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 1px;

  /* 手写体效果增强 */
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(22, 119, 255, 0.4);

  /* 手写体自然效果 */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* 打字机效果：初始状态不可见 */
  opacity: 0;
  transform: translateY(10px) scale(0.8);

  ${({ $delay }) => css`
    animation:
      ${typewriterAnimation} 0.8s ease-out ${$delay}s forwards,
      ${gradientAnimation} 5s ease-in-out infinite ${$delay + 0.8}s;
  `}

  /* 亮色主题下提升对比度与可读性：使用更明亮的蓝色渐变，并减弱文字阴影 */
  [theme-mode='light'] & {
    /* 在动画开始前提供更明亮的静态渐变基色，避免偏暗 */
    --color-1: #4096ff;
    --color-2: #69b1ff;
    --color-3: #91caff;
    --color-4: #bae0ff;

    text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.12),
      0 0 14px rgba(64, 150, 255, 0.3);

    ${({ $delay }) => css`
      animation:
        ${typewriterAnimation} 0.8s ease-out ${$delay}s forwards,
        ${gradientAnimationLight} 5s ease-in-out infinite ${$delay + 0.8}s;
    `}
  }

  /* 亮色主题 + 减少动效：使用静态的高对比度蓝色渐变 */
  @media (prefers-reduced-motion: reduce) {
    [theme-mode='light'] & {
      background: linear-gradient(90deg, #4096ff 0%, #69b1ff 50%, #91caff 100%);
      background-clip: text;
      -webkit-background-clip: text;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }
  }

  /* 支持用户偏好的减少动效设置 */
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    animation: none;
    background: linear-gradient(90deg, #1677ff 0%, #4096ff 50%, #69b1ff 100%);
    background-clip: text;
    -webkit-background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`

interface SplashScreenProps {
  isVisible: boolean
  isExiting: boolean
  onAnimationEnd?: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isVisible,
  isExiting,
  onAnimationEnd
}) => {
  logger.debug('SplashScreen rendered', { isVisible, isExiting })

  // 对于开启“减少动效”的用户，不执行动画，直接在下一帧关闭 Splash
  React.useEffect(() => {
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isExiting && reduced && onAnimationEnd) {
      const id = window.requestAnimationFrame(() => onAnimationEnd())
      return () => window.cancelAnimationFrame(id)
    }
    return
  }, [isExiting, onAnimationEnd])

  const handleAnimationEnd: React.AnimationEventHandler<HTMLDivElement> = (e) => {
    // 仅处理容器自身的退出动画结束，忽略子元素动画的冒泡事件
    if (e.target !== e.currentTarget) return
    if (isExiting && onAnimationEnd) {
      logger.debug('Splash screen exit animation completed')
      onAnimationEnd()
    }
  }

  // 只有在完全退出动画结束后才不渲染组件，确保在此之前始终遮盖底层内容
  if (!isVisible && !isExiting) {
    return null
  }

  return (
    <SplashContainer
      $isVisible={isVisible}
      $isExiting={isExiting}
      onAnimationEnd={handleAnimationEnd}
      role="banner"
    >
      <LogoContainer $isExiting={isExiting}>
        <AnimatedLogo>
          <AnimatedChar $delay={0}>E</AnimatedChar>
          <AnimatedChar $delay={0.15}>c</AnimatedChar>
          <AnimatedChar $delay={0.3}>h</AnimatedChar>
          <AnimatedChar $delay={0.45}>o</AnimatedChar>
          <AnimatedChar $delay={0.6}>P</AnimatedChar>
          <AnimatedChar $delay={0.75}>l</AnimatedChar>
          <AnimatedChar $delay={0.9}>a</AnimatedChar>
          <AnimatedChar $delay={1.05}>y</AnimatedChar>
          <AnimatedChar $delay={1.2}>e</AnimatedChar>
          <AnimatedChar $delay={1.35}>r</AnimatedChar>
        </AnimatedLogo>
      </LogoContainer>
    </SplashContainer>
  )
}

export default SplashScreen
