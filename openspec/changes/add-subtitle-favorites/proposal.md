## Why

Language learners often need to bookmark specific subtitle lines for later review. EchoPlayer already supports click-to-seek in the subtitle list, but there is no per-cue favorite/bookmark flow or dedicated review surface.

## What Changes

- Add a star control on each subtitle cue in the subtitle stream to toggle favorite state
- Add a vertical star tab on the left edge of the subtitle panel listing favorited cues
- Clicking a favorited cue seeks to that line’s position for situational review
- Persist favorited cues per video in `playerSettings.favoriteSubtitles`

## Impact

- Affected specs: `subtitle-favorites` (new capability)
- Affected code: `SubtitleListPanel`, `player.store`, `PlayerSettingsLoader/Saver`, DB schema/migration, i18n
