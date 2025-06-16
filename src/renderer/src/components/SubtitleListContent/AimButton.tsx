import { UnlockOutlined } from '@ant-design/icons'
import { AimOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useSubtitleList } from '@renderer/hooks/features/subtitle/useSubtitleList'

export function AimButton(): React.JSX.Element {
  const { isAutoScrollEnabledRef, enableAutoScroll, disableAutoScroll } = useSubtitleList()

  return (
    <Button
      size="small"
      type="text"
      icon={isAutoScrollEnabledRef.current ? <AimOutlined /> : <UnlockOutlined />}
      onClick={() => {
        if (isAutoScrollEnabledRef.current) {
          disableAutoScroll()
        } else {
          enableAutoScroll()
        }
      }}
      title={isAutoScrollEnabledRef.current ? '定位当前字幕' : '定位当前字幕并启用自动跟随'}
      style={{
        fontSize: 11,
        padding: '2px 6px',
        color: isAutoScrollEnabledRef.current ? '#52c41a' : '#ff7a00',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        outline: 'none'
      }}
    ></Button>
  )
}
