## 1. Persistence

- [x] 1.1 Add `favoriteSubtitles` column migration on `playerSettings`
- [x] 1.2 Update shared schema and Zod player-settings schemas
- [x] 1.3 Wire Loader/Saver JSON map for `favoriteSubtitles`

## 2. State

- [x] 2.1 Add `FavoriteSubtitle` type and `favoriteSubtitles` to player store
- [x] 2.2 Implement `toggleFavoriteSubtitle` / `removeFavoriteSubtitle`
- [x] 2.3 Include `favoriteSubtitles` in persisted `PlayerSettings` slice and `loadSettings`

## 3. UI

- [x] 3.1 Add left vertical tabs (all / favorites) in subtitle panel
- [x] 3.2 Add star button on subtitle rows with stopPropagation
- [x] 3.3 Render favorites list with seek-on-click (index resolve + time fallback)

## 4. i18n

- [x] 4.1 Add favorites-related strings to locale files
