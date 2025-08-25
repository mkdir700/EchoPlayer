import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

interface PlayerHeaderProps {
  title?: string
}

function PlayerHeader({ title = '播放器' }: PlayerHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <HeaderContainer>
      <BackButton onClick={handleBack} aria-label="返回">
        ←
      </BackButton>
      <TitleArea title={title}>{title}</TitleArea>
      <RightTools />
    </HeaderContainer>
  )
}

export default PlayerHeader

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  height: var(--navbar-height, 48px);
  padding: 0 12px;
  background: var(--color-bg-1, #0a0a0a);
  border-bottom: 1px solid var(--color-border, #2a2a2a);
`

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-1, #ddd);
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-bg-3, #2a2a2a);
  }

  &:active {
    background: var(--color-bg-4, #3a3a3a);
  }
`

const TitleArea = styled.div`
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-1, #ddd);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RightTools = styled.div`
  width: 40px;
  height: 28px;
`
