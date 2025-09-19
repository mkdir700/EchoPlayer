import styled from 'styled-components'

export const ControlContainer = styled.div`
  position: relative;
`

// 通用：图标按钮（36x36，透明背景）
export const ControlIconButton = styled.button`
  position: relative;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-2);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text-1);
    transform: scale(1.05);
  }
  &:active {
    background: var(--color-active);
    transform: scale(0.95);
  }
`

// 通用：可切换高亮的图标按钮（支持 $active、$menuOpen 与 $disabled）
export const ControlToggleButton = styled(ControlIconButton)<{
  $active?: boolean
  $menuOpen?: boolean
  $disabled?: boolean
}>`
  background: ${(p) =>
    p.$active ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)' : 'transparent'};
  color: ${(p) =>
    p.$disabled
      ? 'var(--color-text-3)'
      : p.$active
        ? 'var(--color-primary)'
        : 'var(--color-text-2)'};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};

  /* color-mix 不支持时的降级方案 */
  @supports not (background: color-mix(in srgb, white 10%, transparent)) {
    background: ${(p) => (p.$active ? 'var(--color-primary-mute)' : 'transparent')};
  }

  &:hover {
    background: ${(p) =>
      p.$disabled
        ? 'transparent'
        : p.$active
          ? 'color-mix(in srgb, var(--color-primary) 28%, transparent)'
          : 'var(--color-hover)'};
    color: ${(p) =>
      p.$disabled
        ? 'var(--color-text-3)'
        : p.$active
          ? 'var(--color-primary)'
          : 'var(--color-text-1)'};
    transform: ${(p) => (p.$disabled || p.$menuOpen ? 'none' : 'scale(1.05)')};

    @supports not (background: color-mix(in srgb, white 10%, transparent)) {
      background: ${(p) =>
        p.$disabled
          ? 'transparent'
          : p.$active
            ? 'var(--color-primary-soft)'
            : 'var(--color-hover)'};
    }
  }

  &:active {
    background: ${(p) =>
      p.$disabled
        ? 'transparent'
        : p.$active
          ? 'color-mix(in srgb, var(--color-primary) 32%, transparent)'
          : 'var(--color-active)'};
    transform: ${(p) => (p.$disabled || p.$menuOpen ? 'none' : 'scale(0.95)')};

    @supports not (background: color-mix(in srgb, white 10%, transparent)) {
      background: ${(p) =>
        p.$disabled
          ? 'transparent'
          : p.$active
            ? 'var(--color-primary-soft)'
            : 'var(--color-active)'};
    }
  }
`

// 通用：圆形次级按钮（40x40，有边框）
export const ControlCircleButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-background-soft);
  color: var(--color-text-2);
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text-1);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`

// 通用：圆形主按钮（48x48，实心）
export const ControlPrimaryCircleButton = styled.button`
  background: var(--color-primary);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--color-white);
  font-size: 18px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--color-primary-mute);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
    box-shadow: 0 6px 16px var(--color-primary-soft);
  }
  &:active {
    transform: scale(0.95);
  }
`

// 通用：玻璃弹层（下方 45px 居中）
export const GlassPopup = styled.div`
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--modal-background-glass);
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  box-shadow: var(--modal-shadow);
  border: 1px solid var(--modal-border-color);
  z-index: 1000;
  color: var(--color-text);
  backdrop-filter: blur(20px);
`
