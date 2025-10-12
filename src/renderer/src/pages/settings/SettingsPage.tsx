import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { Command, Eye, Info, Monitor, PlayCircle, Settings2 } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import AboutSettings from './AboutSettings'
import { AppearanceSettings } from './AppearanceSettings'
import GeneralSettings from './GeneralSettings'
import PlaybackSettings from './PlaybackSettings'
import PluginsSettings from './PluginsSettings'
import ShortcutSettings from './ShortcutSettings'

/**
 * 渲染设置页面布局和导航
 * 包含侧边导航栏和主要内容区域
 */
export function SettingsPage(): React.JSX.Element {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isRoute = (path: string): string => (pathname.startsWith(path) ? 'active' : '')

  return (
    <Container>
      <Navbar>
        <NavbarCenter></NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        <SettingMenus>
          <MenuItemLink to="/settings/appearance">
            <MenuItem className={isRoute('/settings/appearance')}>
              <Eye size={18} />
              {t('settings.appearance.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/general">
            <MenuItem className={isRoute('/settings/general')}>
              <Settings2 size={18} />
              {t('settings.general.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/shortcut">
            <MenuItem className={isRoute('/settings/shortcut')}>
              <Command size={18} />
              {t('settings.shortcut.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/playback">
            <MenuItem className={isRoute('/settings/playback')}>
              <PlayCircle size={18} />
              {t('settings.playback.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/plugins">
            <MenuItem className={isRoute('/settings/plugins')}>
              <Monitor size={18} />
              {t('settings.plugins.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/about">
            <MenuItem className={isRoute('/settings/about')}>
              <Info size={18} />
              {t('settings.about.title')}
            </MenuItem>
          </MenuItemLink>
        </SettingMenus>
        <SettingContent>
          <Routes>
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="general" element={<GeneralSettings />} />
            <Route path="shortcut" element={<ShortcutSettings />} />
            <Route path="playback" element={<PlaybackSettings />} />
            <Route path="plugins" element={<PluginsSettings />} />
            <Route path="about" element={<AboutSettings />} />
          </Routes>
        </SettingContent>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
]`

const SettingMenus = styled.ul`
  display: flex;
  flex-direction: column;
  min-width: var(--settings-width);
  border-right: 0.5px solid var(--color-border);
  padding: 10px;
  user-select: none;
`

const MenuItemLink = styled(Link)`
  text-decoration: none;
  color: var(--color-text-1);
  margin-bottom: 5px;
`

const MenuItem = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  width: 100%;
  cursor: pointer;
  border-radius: var(--list-item-border-radius);
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border: 0.5px solid transparent;
  .anticon {
    font-size: 16px;
    opacity: 0.8;
  }
  .iconfont {
    font-size: 18px;
    line-height: 18px;
    opacity: 0.7;
    margin-left: -1px;
  }
  &:hover {
    background: var(--color-background-soft);
  }
  &.active {
    background: var(--color-background-soft);
    border: 0.5px solid var(--color-border);
  }
`

const SettingContent = styled.div`
  display: flex;
  height: 100%;
  flex: 1;
`

export default SettingsPage
