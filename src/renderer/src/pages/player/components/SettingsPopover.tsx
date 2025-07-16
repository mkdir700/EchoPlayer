import styled from 'styled-components'

function SettingsPopover() {
  return <Root aria-label="settings-popover" />
}

export default SettingsPopover

const Root = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
`
