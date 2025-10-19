import { useTheme } from '@renderer/contexts'
import { getThemeModeLabel } from '@renderer/i18n/label'
import { isMac, ThemeMode } from '@renderer/infrastructure'
import { useFullscreen } from '@renderer/infrastructure/hooks/useFullscreen'
import useNavBackgroundColor from '@renderer/infrastructure/hooks/useNavBackgroundColor'
import { Tooltip } from 'antd'
import { LucideHeart, LucideHome, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Sidebar: FC = () => {
  const { token, theme, settedTheme, setTheme } = useTheme()
  const backgroundColor = useNavBackgroundColor()
  const isFullscreen = useFullscreen()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const to = async (path: string) => {
    navigate(path)
  }

  return (
    <Container
      $isFullscreen={isFullscreen}
      id="app-sidebar"
      style={{ backgroundColor, zIndex: token.zIndexPopupBase }}
    >
      <MainMenusContainer>
        <MainMenus />
      </MainMenusContainer>
      <Divider />
      <Menus>
        <Tooltip
          title={t('settings.theme.title') + ': ' + getThemeModeLabel(settedTheme)}
          mouseEnterDelay={0.8}
          placement="right"
        >
          <Icon
            theme={theme}
            onClick={() => {
              if (settedTheme === ThemeMode.light) {
                setTheme(ThemeMode.dark)
              } else if (settedTheme === ThemeMode.dark) {
                setTheme(ThemeMode.system)
              } else {
                setTheme(ThemeMode.light)
              }
            }}
          >
            {settedTheme === ThemeMode.system ? (
              <Monitor size={20} className="icon" />
            ) : settedTheme === ThemeMode.dark ? (
              <Moon size={20} className="icon" />
            ) : (
              <Sun size={20} className="icon" />
            )}
          </Icon>
        </Tooltip>
        <Tooltip title={t('settings.title')} mouseEnterDelay={0.8} placement="right">
          <StyledLink
            onClick={async () => {
              await to('/settings/appearance')
            }}
          >
            <Icon theme={theme} className={pathname.startsWith('/settings') ? 'active' : ''}>
              <Settings size={20} className="icon" />
            </Icon>
          </StyledLink>
        </Tooltip>
      </Menus>
    </Container>
  )
}

const MainMenus: FC = () => {
  const { theme } = useTheme()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isRoute = (path: string): string => {
    // 特殊处理根路径，只有完全匹配时才激活
    if (path === '/') {
      return pathname === '/' ? 'active' : ''
    }
    // 对于其他路径，使用 startsWith 但确保后面是 '/' 或者是完全匹配
    return pathname === path || pathname.startsWith(path + '/') ? 'active' : ''
  }

  const menuItems = {
    home: {
      path: '/',
      icon: <LucideHome size={20} className="icon" />,
      label: t('common.home'),
      disabled: false
    },
    favorites: {
      path: '/favorites',
      icon: <LucideHeart size={20} className="icon" />,
      label: t('common.favorites'),
      disabled: true
    }
  }

  return (
    <>
      {Object.entries(menuItems).map(([key, item]) => {
        const isActive = isRoute(item.path) === 'active'
        const tooltipTitle = item.disabled
          ? key === 'favorites'
            ? t('common.favorites_developing')
            : item.label
          : item.label

        return (
          <Tooltip key={key} title={tooltipTitle} placement="right" mouseEnterDelay={0.8}>
            <StyledLink
              onClick={item.disabled ? undefined : () => navigate(item.path)}
              className={isActive ? 'active' : ''}
            >
              <Icon
                theme={theme}
                className={`${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              >
                {item.icon}
              </Icon>
            </StyledLink>
          </Tooltip>
        )
      })}
    </>
  )
}

const Container = styled.div<{ $isFullscreen: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  padding-bottom: 12px;
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: ${({ $isFullscreen }) =>
    isMac && !$isFullscreen ? 'calc(100vh - var(--navbar-height))' : '100vh'};
  -webkit-app-region: drag !important;
  margin-top: ${({ $isFullscreen }) => (isMac && !$isFullscreen ? 'var(--navbar-height)' : 0)};

  .sidebar-avatar {
    margin-bottom: ${isMac ? '12px' : '12px'};
    margin-top: ${isMac ? '0px' : '2px'};
    -webkit-app-region: none;
  }
`

const MainMenusContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  gap: 5px;
`

const Menus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`

const Icon = styled.div<{ theme: string }>`
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  box-sizing: border-box;
  -webkit-app-region: none;
  border: 0.5px solid transparent;
  &:hover {
    background-color: ${({ theme }) =>
      theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)'};
    opacity: 0.8;
    cursor: pointer;
    .icon {
      color: var(--color-icon-white);
    }
  }
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    .icon {
      color: var(--color-text-secondary);
    }
  }
  &.disabled:hover {
    background-color: transparent;
    opacity: 0.4;
    cursor: not-allowed;
    .icon {
      color: var(--color-text-secondary);
    }
  }
  &.active {
    background-color: ${({ theme }) =>
      theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)'};
    border: 0.5px solid var(--color-border);
    .icon {
      color: var(--color-primary);
    }
  }

  @keyframes borderBreath {
    0% {
      opacity: 0.1;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.1;
    }
  }

  &.opened-minapp {
    position: relative;
  }
  &.opened-minapp::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: inherit;
    opacity: 0.3;
    border: 0.5px solid var(--color-primary);
  }
`

const StyledLink = styled.div`
  text-decoration: none;
  -webkit-app-region: none;
  &* {
    user-select: none;
  }
`

/* AppsContainer 备用占位，暂未使用，移除以消除未使用变量告警
const AppsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 10px;
  -webkit-app-region: none;
  &::-webkit-scrollbar {
    display: none;
  }
`
*/

const Divider = styled.div`
  width: 50%;
  margin: 8px 0;
  border-bottom: 0.5px solid var(--color-border);
`

export default Sidebar
