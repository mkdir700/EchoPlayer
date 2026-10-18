## ADDED Requirements

### Requirement: Favorite Subtitle Cue

The system SHALL allow the user to favorite and unfavorite an individual subtitle cue from the subtitle stream by clicking a star control on that cue. Favoriting MUST NOT trigger seek by itself.

#### Scenario: Toggle favorite on cue

- **WHEN** the user clicks the star control on a subtitle cue
- **THEN** that cue is added to or removed from the video’s favorite list
- **AND** the star control reflects the updated favorite state
- **AND** playback position is not changed solely by the star click

### Requirement: Favorites Review Tab

The system SHALL provide a star tab in the subtitle panel that lists favorited cues for the current video so the user can review them.

#### Scenario: View favorited cues

- **WHEN** the user opens the star tab in the subtitle panel
- **THEN** the panel shows the favorited cues for the current video
- **AND** each entry displays timing and original text from the saved snapshot

#### Scenario: Empty favorites

- **WHEN** the user opens the star tab and no cues are favorited
- **THEN** the panel shows an empty state explaining that favorites will appear here

### Requirement: Seek From Favorite Cue

The system SHALL seek to the corresponding subtitle position when the user clicks a favorited cue, enabling situational review.

#### Scenario: Jump to matching cue

- **WHEN** the user clicks a favorited cue that still matches a cue in the current subtitle list
- **THEN** the player seeks to that cue via subtitle-index seek

#### Scenario: Fallback seek by time

- **WHEN** the user clicks a favorited cue that cannot be matched in the current subtitle list
- **THEN** the player seeks to the saved `startTime` of the favorite

### Requirement: Per-Video Persistence

The system SHALL persist favorited cues per video across sessions.

#### Scenario: Restore favorites on reopen

- **WHEN** the user reopens a video that previously had favorited cues
- **THEN** those favorites are restored in the player state and star tab
