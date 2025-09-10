import ThumbnailWithFallback from '@renderer/pages/home/ThumbnailWithFallback'
import { HomePageVideoItem } from '@renderer/services/HomePageVideos'
import { useSearchStore } from '@renderer/state/stores/search.store'
import { Clock, Play } from 'lucide-react'
import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

interface VideoSearchResultProps {
  video: HomePageVideoItem
  searchQuery: string
}

const VideoSearchResult: FC<VideoSearchResultProps> = ({ video, searchQuery }) => {
  const navigate = useNavigate()
  const { hideSearch } = useSearchStore()

  const handleClick = () => {
    // 点击跳转到播放页面
    navigate(`/player/${video.id}`)
    // 关闭搜索界面
    hideSearch()
  }

  // 高亮匹配的文本
  const highlightText = (text: string, query: string): React.ReactElement => {
    if (!query.trim()) {
      return <span>{text}</span>
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <HighlightText key={index}>{part}</HighlightText>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    )
  }

  return (
    <ResultItem onClick={handleClick}>
      <ThumbnailContainer>
        <ThumbnailWithFallback src={video.thumbnail} alt={video.title} />
        <PlayButton>
          <Play size={16} />
        </PlayButton>
        {video.watchProgress > 0 && (
          <ProgressBar>
            <ProgressFill progress={video.watchProgress} />
          </ProgressBar>
        )}
      </ThumbnailContainer>

      <ContentContainer>
        <VideoTitle>{highlightText(video.title, searchQuery)}</VideoTitle>

        {video.subtitle && (
          <VideoSubtitle>{highlightText(video.subtitle, searchQuery)}</VideoSubtitle>
        )}

        <VideoMeta>
          <MetaItem>
            <Clock size={12} />
            <span>{video.durationText}</span>
          </MetaItem>
          <MetaItem>
            <span>{video.publishedAt}</span>
          </MetaItem>
        </VideoMeta>
      </ContentContainer>
    </ResultItem>
  )
}

// 样式组件
const ResultItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-radius: 8px;
  margin: 0 8px;

  &:hover {
    background-color: var(--color-background-soft);
  }

  &:active {
    background-color: var(--color-background-mute);
    transform: translateY(1px);
  }
`

const ThumbnailContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  width: 120px;
  height: 68px;
`

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
`

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.3);
`

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background-color: var(--color-primary);
  width: ${(props) => props.progress * 100}%;
  transition: width 0.2s ease;
`

const ContentContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const VideoTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const VideoSubtitle = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const VideoMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);

  svg {
    flex-shrink: 0;
  }
`

const HighlightText = styled.span`
  background-color: var(--color-primary);
  color: white;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 500;
`

export default VideoSearchResult
