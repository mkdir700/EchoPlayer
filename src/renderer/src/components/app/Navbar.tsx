import { isLinux, isMac, isWin, useIsPlayerPage } from '@renderer/infrastructure'
import { useFullscreen } from '@renderer/infrastructure/hooks/useFullscreen'
import useNavBackgroundColor from '@renderer/infrastructure/hooks/useNavBackgroundColor'
import type { FC, PropsWithChildren } from 'react'
import type { HTMLAttributes } from 'react'
import styled from 'styled-components'

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>

export const Navbar: FC<Props> = ({ children, ...props }) => {
  const backgroundColor = useNavBackgroundColor()
  const isPlayerPage = useIsPlayerPage()

  return (
    <NavbarContainer {...props} style={{ backgroundColor }} $isPlayerPage={isPlayerPage}>
      {children}
    </NavbarContainer>
  )
}

export const NavbarLeft: FC<Props> = ({ children, ...props }) => {
  const isPlayerPage = useIsPlayerPage()

  return (
    <NavbarLeftContainer {...props} $isPlayerPage={isPlayerPage}>
      {children}
    </NavbarLeftContainer>
  )
}

export const NavbarCenter: FC<Props> = ({ children, ...props }) => {
  return <NavbarCenterContainer {...props}>{children}</NavbarCenterContainer>
}

export const NavbarRight: FC<Props> = ({ children, ...props }) => {
  return <NavbarRightContainer {...props}>{children}</NavbarRightContainer>
}

export const NavbarMain: FC<Props> = ({ children, ...props }) => {
  const isFullscreen = useFullscreen()
  return (
    <NavbarMainContainer {...props} $isFullscreen={isFullscreen}>
      {children}
    </NavbarMainContainer>
  )
}

export const NavbarHeader: FC<Props> = ({ children, ...props }) => {
  return <NavbarHeaderContent {...props}>{children}</NavbarHeaderContent>
}

const NavbarContainer = styled.div<{ $isPlayerPage: boolean }>`
  min-width: 100%;
  display: flex;
  flex-direction: row;
  min-height: var(--navbar-height);
  max-height: var(--navbar-height);
  margin-left: ${({ $isPlayerPage }) => {
    if ($isPlayerPage) return '0' // 播放页面不需要侧边栏偏移
    return isMac ? 'calc(var(--sidebar-width) * -1)' : 0
  }};
  padding-left: ${({ $isPlayerPage }) => {
    if ($isPlayerPage) return '0' // 播放页面不需要侧边栏补偿
    return isMac ? 'var(--sidebar-width)' : 0
  }};
  -webkit-app-region: drag;
`

const NavbarLeftContainer = styled.div<{ $isPlayerPage: boolean }>`
  min-width: var(--assistants-width);
  padding: 0 10px;
  padding-left: ${({ $isPlayerPage }) => {
    if (!$isPlayerPage) return '10px'

    // 播放页面的平台特定padding
    if (isMac) return '60px' // macOS: 避免交通灯遮挡
    if (isWin) return '15px' // Windows: 适当增加左边距
    if (isLinux) return '15px' // Linux: 适当增加左边距
    return '15px' // 默认
  }};
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: bold;
  color: var(--color-text-1);
`

const NavbarCenterContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 ${isMac ? '20px' : 0};
  font-weight: bold;
  color: var(--color-text-1);
`

const NavbarRightContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: flex-end;
  min-width: auto;
  flex-shrink: 0;
`

const NavbarMainContainer = styled.div<{ $isFullscreen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${isMac ? '20px' : 0};
  font-weight: bold;
  color: var(--color-text-1);
  padding-right: 12px;
`

const NavbarHeaderContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  min-height: var(--navbar-height);
  max-height: var(--navbar-height);
`
