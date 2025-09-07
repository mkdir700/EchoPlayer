import { useSearchStore } from '@renderer/state/stores/search.store'
import { Search } from 'lucide-react'
import { FC, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const SearchOverlay: FC = () => {
  const { t } = useTranslation()
  const { isSearchVisible, searchQuery, hideSearch, setSearchQuery, clearSearch } = useSearchStore()
  const inputRef = useRef<HTMLInputElement>(null)

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchVisible) {
        hideSearch()
      }
    }

    if (isSearchVisible) {
      document.addEventListener('keydown', handleKeyDown)
      // 自动聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchVisible, hideSearch])

  // 处理覆盖层点击
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      hideSearch()
    }
  }

  // 处理输入变化
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  // 处理搜索提交
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      // TODO: 实现实际的搜索逻辑
    }
  }

  // 清除搜索
  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  if (!isSearchVisible) {
    return null
  }

  return (
    <Overlay onClick={handleOverlayClick}>
      <SearchContainer>
        <UnifiedSearchBox>
          <SearchForm onSubmit={handleSubmit}>
            <SearchInputContainer>
              <SearchIcon>
                <Search size={20} />
              </SearchIcon>
              <SearchInput
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder={t('common.search_placeholder', '搜索视频...')}
                autoComplete="off"
                spellCheck={false}
              />
              {searchQuery && (
                <ClearButton type="button" onClick={handleClear}>
                  ×
                </ClearButton>
              )}
            </SearchInputContainer>
          </SearchForm>

          {/* 搜索结果区域 - 与输入框一体化 */}
          {searchQuery && (
            <SearchResults>
              <EmptyState>{t('common.search_no_results', '暂无搜索结果')}</EmptyState>
            </SearchResults>
          )}
        </UnifiedSearchBox>
      </SearchContainer>
    </Overlay>
  )
}

// 样式组件
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const SearchContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 20px;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`

// 统一的搜索容器，包含输入框和结果
const UnifiedSearchBox = styled.div`
  background-color: #222222;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease-in-out;
  overflow: hidden; /* 确保内容不会超出圆角边界 */

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.16),
      0 0 0 3px rgba(22, 119, 255, 0.1);
  }

  /* 确保在亮色主题下也有合适的背景色 */
  [theme-mode='light'] & {
    background-color: #ffffff;
  }
`

const SearchForm = styled.form`
  width: 100%;
`

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  /* 移除背景色、边框和圆角，因为现在由 UnifiedSearchBox 统一处理 */
  transition: all 0.2s ease-in-out;
`

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  color: var(--color-text-secondary);
  pointer-events: none;
`

const SearchInput = styled.input`
  flex: 1;
  height: 56px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 18px;
  color: var(--color-text);
  padding: 0 16px 0 0;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border: none;
  border-radius: 50%;
  background-color: var(--color-background-soft);
  color: var(--color-text-secondary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--color-background-mute);
    color: var(--color-text);
  }

  &:active {
    transform: scale(0.95);
  }
`

const SearchResults = styled.div`
  /* 移除所有独立的样式，因为现在是 UnifiedSearchBox 的一部分 */
  border-top: 1px solid var(--color-border-soft);
  max-height: 400px;
  overflow-y: auto;

  /* 添加细微的分隔线来区分输入区域和结果区域 */
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: var(--color-border-soft);
    opacity: 0.5;
  }
`

const EmptyState = styled.div`
  padding: 24px 32px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
`

export default SearchOverlay
