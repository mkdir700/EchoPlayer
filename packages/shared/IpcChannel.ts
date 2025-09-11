export enum IpcChannel {
  App_Info = 'app:info',
  App_Reload = 'app:reload',
  App_LogToMain = 'app:log-to-main',
  App_ShowUpdateDialog = 'app:show-update-dialog',
  App_SetLanguage = 'app:set-language',
  App_SetEnableSpellCheck = 'app:set-enable-spell-check',
  App_SetSpellCheckLanguages = 'app:set-spell-check-languages',
  App_SetLaunchOnBoot = 'app:set-launch-on-boot',
  App_SetLaunchToTray = 'app:set-launch-to-tray',
  App_SetTray = 'app:set-tray',
  App_SetTrayOnClose = 'app:set-tray-on-close',
  App_SetAutoUpdate = 'app:set-auto-update',
  App_SetTestPlan = 'app:set-test-plan',
  App_SetTestChannel = 'app:set-test-channel',
  App_MacIsProcessTrusted = 'app:mac-is-process-trusted',
  App_MacRequestProcessTrust = 'app:mac-request-process-trust',
  App_SetTheme = 'app:set-theme',
  App_ClearCache = 'app:clear-cache',
  App_GetCacheSize = 'app:get-cache-size',
  App_SetStopQuitApp = 'app:set-stop-quit-app',
  App_Select = 'app:select',
  App_HasWritePermission = 'app:has-write-permission',
  App_SetAppDataPath = 'app:set-app-data-path',
  App_GetDataPathFromArgs = 'app:get-data-path-from-args',
  App_FlushAppData = 'app:flush-app-data',
  App_IsNotEmptyDir = 'app:is-not-empty-dir',
  App_Copy = 'app:copy',
  App_RelaunchApp = 'app:relaunch-app',
  App_CheckForUpdate = 'app:check-for-update',

  // 通知相关 IPC 通道 / Notification-related IPC channels
  Notification_Send = 'notification:send',
  Notification_OnClick = 'notification:on-click',

  // 系统相关 IPC 通道 / System-related IPC channels
  System_GetDeviceType = 'system:get-device-type',
  System_GetHostname = 'system:get-hostname',
  System_ToggleDevTools = 'system:toggle-dev-tools',

  //file
  File_Open = 'file:open',
  File_OpenPath = 'file:openPath',
  File_Save = 'file:save',
  File_Select = 'file:select',
  File_Upload = 'file:upload',
  File_Clear = 'file:clear',
  File_Read = 'file:read',
  File_ReadFromPath = 'file:readFromPath',
  File_ListDirectory = 'file:listDirectory',
  File_Delete = 'file:delete',
  File_DeleteDir = 'file:deleteDir',
  File_Get = 'file:get',
  File_SelectFolder = 'file:selectFolder',
  File_CreateTempFile = 'file:createTempFile',
  File_Write = 'file:write',
  File_WriteWithId = 'file:writeWithId',
  File_SaveImage = 'file:saveImage',
  File_Base64Image = 'file:base64Image',
  File_SaveBase64Image = 'file:saveBase64Image',
  File_Download = 'file:download',
  File_Copy = 'file:copy',
  File_BinaryImage = 'file:binaryImage',
  File_Base64File = 'file:base64File',
  File_OpenWithRelativePath = 'file:openWithRelativePath',

  Config_Set = 'config:set',
  Config_Get = 'config:get',

  // 词典相关 IPC 通道 / Dictionary-related IPC channels
  Dictionary_Eudic = 'dictionary:eudic',

  // FFmpeg 相关 IPC 通道 / FFmpeg related IPC channels
  Ffmpeg_GetPath = 'ffmpeg:get-path',
  Ffmpeg_CheckExists = 'ffmpeg:check-exists',
  Ffmpeg_GetVersion = 'ffmpeg:get-version',
  Ffmpeg_GetVideoInfo = 'ffmpeg:get-video-info',
  Ffmpeg_Warmup = 'ffmpeg:warmup',
  Ffmpeg_GetWarmupStatus = 'ffmpeg:get-warmup-status',

  // MediaInfo 相关 IPC 通道 / MediaInfo related IPC channels
  MediaInfo_CheckExists = 'mediainfo:check-exists',
  MediaInfo_GetVersion = 'mediainfo:get-version',
  MediaInfo_GetVideoInfo = 'mediainfo:get-video-info',
  MediaInfo_GetVideoInfoWithStrategy = 'mediainfo:get-video-info-with-strategy',

  // 文件系统相关 IPC 通道 / File system related IPC channels
  Fs_CheckFileExists = 'fs:check-file-exists',
  Fs_ReadFile = 'fs:read-file',
  Fs_GetFileUrl = 'fs:get-file-url',
  Fs_SelectFile = 'fs:select-file',
  Fs_GetFileInfo = 'fs:get-file-info',
  Fs_ReadDir = 'fs:read-directory',
  Fs_ValidateFile = 'fs:validate-file',
  Fs_GetTempDir = 'fs:get-temp-dir',
  Fs_CopyToTempDir = 'fs:copy-to-temp-dir',
  Fs_DeleteTempFile = 'fs:delete-temp-file',
  Fs_SaveTransCodedFile = 'fs:save-transcoded-file',

  ShowItemInFolder = 'shell:show-item-in-folder',
  Open_Website = 'open:website',

  // 窗口相关 IPC 通道 / Window-related IPC channels
  Window_SetTitleBarOverlay = 'window:set-title-bar-overlay',
  Window_SetAlwaysOnTop = 'window:set-always-on-top',
  Window_IsAlwaysOnTop = 'window:is-always-on-top',
  Window_Minimize = 'window:minimize',
  Window_Maximize = 'window:maximize',
  Window_Close = 'window:close',
  Window_Restart = 'window:restart',
  Window_IsFullScreen = 'window:is-full-screen',
  Window_EnterFullScreen = 'window:enter-full-screen',
  Window_ExitFullScreen = 'window:exit-full-screen',
  Window_ToggleFullScreen = 'window:toggle-full-screen',

  // shortcut
  Shortcuts_Update = 'shortcuts:update',

  // 数据库相关 IPC 通道 / Database-related IPC channels
  // Files DAO
  DB_Files_Add = 'db:files:add',
  DB_Files_FindByPath = 'db:files:find-by-path',
  DB_Files_FindByType = 'db:files:find-by-type',
  DB_Files_FindById = 'db:files:find-by-id',
  DB_Files_Update = 'db:files:update',
  DB_Files_Delete = 'db:files:delete',

  // VideoLibrary DAO
  DB_VideoLibrary_Add = 'db:video-library:add',
  DB_VideoLibrary_FindByFileId = 'db:video-library:find-by-file-id',
  DB_VideoLibrary_GetRecentlyPlayed = 'db:video-library:get-recently-played',
  DB_VideoLibrary_GetFavorites = 'db:video-library:get-favorites',
  DB_VideoLibrary_UpdatePlayProgress = 'db:video-library:update-play-progress',
  DB_VideoLibrary_ToggleFavorite = 'db:video-library:toggle-favorite',
  DB_VideoLibrary_GetRecords = 'db:video-library:get-records',
  DB_VideoLibrary_FindById = 'db:video-library:find-by-id',
  DB_VideoLibrary_UpdateRecord = 'db:video-library:update-record',
  DB_VideoLibrary_DeleteRecord = 'db:video-library:delete-record',
  DB_VideoLibrary_DeleteRecords = 'db:video-library:delete-records',
  DB_VideoLibrary_ClearAll = 'db:video-library:clear-all',
  DB_VideoLibrary_SearchRecords = 'db:video-library:search-records',
  DB_VideoLibrary_GetMostPlayed = 'db:video-library:get-most-played',

  // SubtitleLibrary DAO
  DB_SubtitleLibrary_Add = 'db:subtitle-library:add',
  DB_SubtitleLibrary_FindByVideoId = 'db:subtitle-library:find-by-video-id',
  DB_SubtitleLibrary_FindByVideoIdAndPath = 'db:subtitle-library:find-by-video-id-and-path',
  DB_SubtitleLibrary_FindById = 'db:subtitle-library:find-by-id',
  DB_SubtitleLibrary_Update = 'db:subtitle-library:update',
  DB_SubtitleLibrary_FindAll = 'db:subtitle-library:find-all',
  DB_SubtitleLibrary_Clear = 'db:subtitle-library:clear',
  DB_SubtitleLibrary_FindAllOrderedByCreatedAt = 'db:subtitle-library:find-all-ordered-by-created-at',
  DB_SubtitleLibrary_Delete = 'db:subtitle-library:delete',

  // PlayerSettings DAO
  DB_PlayerSettings_Get = 'db:player-settings:get',
  DB_PlayerSettings_Save = 'db:player-settings:save',
  DB_PlayerSettings_Delete = 'db:player-settings:delete',
  DB_PlayerSettings_GetByVideoIds = 'db:player-settings:get-by-video-ids',
  DB_PlayerSettings_Has = 'db:player-settings:has',

  // Database Transaction
  DB_Transaction = 'db:transaction',

  // events
  ThemeUpdated = 'theme:updated',
  UpdateDownloadedCancelled = 'update-downloaded-cancelled',
  RestoreProgress = 'restore-progress',
  UpdateError = 'update-error',
  UpdateAvailable = 'update-available',
  UpdateNotAvailable = 'update-not-available',
  DownloadProgress = 'download-progress',
  UpdateDownloaded = 'update-downloaded',
  DownloadUpdate = 'download-update',
  FullscreenStatusChanged = 'fullscreen-status-changed',
  HideMiniWindow = 'hide-mini-window',
  ShowMiniWindow = 'show-mini-window'
}
