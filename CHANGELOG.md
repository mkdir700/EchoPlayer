# [1.1.0-alpha.7](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.6...v1.1.0-alpha.7) (2025-10-14)

### Bug Fixes

- **AppUpdater, FFmpegDownloadService:** update default mirror source to global ([52c2999](https://github.com/mkdir700/EchoPlayer/commit/52c299983cee09333078d65669dfa93d38eb9b7f))

### Features

- **RegionDetection:** integrate region detection service for IP-based country identification ([9881bc6](https://github.com/mkdir700/EchoPlayer/commit/9881bc6b32dccf52599149bc186fdcca80d19a00))

# [1.1.0-alpha.6](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.5...v1.1.0-alpha.6) (2025-10-14)

# [1.1.0-alpha.5](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.4...v1.1.0-alpha.5) (2025-10-14)

### Bug Fixes

- **workflow:** update artifact listing command for better compatibility ([093aeb0](https://github.com/mkdir700/EchoPlayer/commit/093aeb08026e21f366995db6d15a6c961595aa01))

### Reverts

- "fix(build): adjust resource handling for media-server in packaging" ([d57d94c](https://github.com/mkdir700/EchoPlayer/commit/d57d94c30a8a195ac9ca4b57d8496e40cda04a16))

# [1.1.0-alpha.4](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.3...v1.1.0-alpha.4) (2025-10-14)

### Bug Fixes

- **build:** adjust resource handling for media-server in packaging ([505e5b8](https://github.com/mkdir700/EchoPlayer/commit/505e5b8653b66dffe3f241f657c2f7a7a26fd2fe))

### Features

- **player:** add toggle auto-pause functionality ([a14886e](https://github.com/mkdir700/EchoPlayer/commit/a14886e22924234dfeca24a71d0efe3bb37a9910))

# [1.1.0-alpha.3](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.2...v1.1.0-alpha.3) (2025-10-13)

### Bug Fixes

- **codec-compatibility:** handle missing codec information gracefully ([46ed61a](https://github.com/mkdir700/EchoPlayer/commit/46ed61a740a1ff513fa6c143d1edf454165cd818))
- **FFmpegSection:** manage completion timeout for download process ([99018a0](https://github.com/mkdir700/EchoPlayer/commit/99018a0cdb69eed0a686bcc53a54402e55087120))
- **FFprobeSection:** add return statement to download progress polling function ([d99231f](https://github.com/mkdir700/EchoPlayer/commit/d99231f4132312f324eb8a2757dea7f0990dc7cd))
- **FFprobeSection:** ensure timeout cleanup after download success ([75d8429](https://github.com/mkdir700/EchoPlayer/commit/75d842954bc729d634a070cf9fd79e7c987a6413))
- **FFprobeSection:** manage success timeout for download completion ([f4332d0](https://github.com/mkdir700/EchoPlayer/commit/f4332d0e994e38358d57591d4455872a5f3ea173))
- **FFprobeSection:** standardize font size using theme constants ([4665620](https://github.com/mkdir700/EchoPlayer/commit/4665620868f2eae2e4b4d35ee8e377e06dad5324))
- **FFprobeSection:** standardize spacing in styled components ([ef89ef6](https://github.com/mkdir700/EchoPlayer/commit/ef89ef68237921942f3b8b8ec1738f9d501e9b5d))
- **MediaServerService:** enhance error handling for file existence check ([fe552e3](https://github.com/mkdir700/EchoPlayer/commit/fe552e33afcc1b3f8281b5034433afe2bfca8864))
- **MediaServerService:** replace fs.existsSync with async stat for file existence check ([566af29](https://github.com/mkdir700/EchoPlayer/commit/566af29e4de8b6d7f5890c4972162a093746ad99))
- **player:** apply playback rate change through orchestrator when cycling speeds ([#210](https://github.com/mkdir700/EchoPlayer/issues/210)) ([d69cc52](https://github.com/mkdir700/EchoPlayer/commit/d69cc52ea172f9dad098824bf69c80ab84a83771))
- **player:** remove HLS player missing error handling ([5c2aa64](https://github.com/mkdir700/EchoPlayer/commit/5c2aa6480a81c1a4d9efe1cb4cddde6db716e3f9))
- **TranscodeLoadingIndicator:** remove logging for loading indicator display ([fe69cd0](https://github.com/mkdir700/EchoPlayer/commit/fe69cd0b45c042669e13aa5f9b9f07a624db0738))
- **UvBootstrapperService:** enhance UV download logic with cached path checks ([e39cb7d](https://github.com/mkdir700/EchoPlayer/commit/e39cb7dd14550e77546a0903832d3b1548507f2a))
- **UvBootstrapperService:** ensure temp directory cleanup after download ([811b597](https://github.com/mkdir700/EchoPlayer/commit/811b59740b02e06e6202906312e970acdcc44738))
- **UvBootstrapperService:** prevent concurrent downloads by checking download controllers ([17be090](https://github.com/mkdir700/EchoPlayer/commit/17be0902ab53de509149ee748101e8fec85dfda8))
- **VolumeIndicator:** skip indicator display on initial render ([d0cfb23](https://github.com/mkdir700/EchoPlayer/commit/d0cfb234b86aeb489937320d29750ddc0a6315e4))

### Features

- **media-server:** add transcode cache cleanup for deleted videos ([b5b9601](https://github.com/mkdir700/EchoPlayer/commit/b5b96012296bee3fd943a0090d625bd2681c4fc2))
- **player:** HLS session progress polling with media server integration ([#209](https://github.com/mkdir700/EchoPlayer/issues/209)) ([0135646](https://github.com/mkdir700/EchoPlayer/commit/0135646eb37e54aa797d77b41a740a16e96a986f))

# [1.1.0-alpha.2](https://github.com/mkdir700/EchoPlayer/compare/v1.1.0-alpha.1...v1.1.0-alpha.2) (2025-10-12)

### Features

- **media-server:** implement runtime runtime management system ([#204](https://github.com/mkdir700/EchoPlayer/issues/204)) ([2d179f5](https://github.com/mkdir700/EchoPlayer/commit/2d179f55180b7a79b07f960ebe7003665faabf9b))
- **player:** add animated loading progress bar to PlayerPage ([#206](https://github.com/mkdir700/EchoPlayer/issues/206)) ([53f7393](https://github.com/mkdir700/EchoPlayer/commit/53f7393b8c7abba9b5c84985766bcd8c01dfa366))
- **player:** add media server recommendation prompt for incompatible videos ([#205](https://github.com/mkdir700/EchoPlayer/issues/205)) ([12b4434](https://github.com/mkdir700/EchoPlayer/commit/12b4434d259b86d309fafab3c57c2c7a58e6f6fb))

# [1.1.0-alpha.1](https://github.com/mkdir700/EchoPlayer/compare/v1.0.0...v1.1.0-alpha.1) (2025-10-11)

### Bug Fixes

- **homepage:** improve bottom spacing for card grid ([#194](https://github.com/mkdir700/EchoPlayer/issues/194)) ([801b6cd](https://github.com/mkdir700/EchoPlayer/commit/801b6cd6ec6b409d5a7e9173a536212e7af64760))
- remove green glow effect from progress bar ([#196](https://github.com/mkdir700/EchoPlayer/issues/196)) ([abc6f3e](https://github.com/mkdir700/EchoPlayer/commit/abc6f3edb00c4a7000940b03fb2fe9ce5dfb26ea)), closes [#e50914](https://github.com/mkdir700/EchoPlayer/issues/e50914) [#00b96](https://github.com/mkdir700/EchoPlayer/issues/00b96)
- **semantic-release:** enhance version increment rules for prerelease branches ([#199](https://github.com/mkdir700/EchoPlayer/issues/199)) ([5d1e533](https://github.com/mkdir700/EchoPlayer/commit/5d1e5339589e9366776acefeed3633327c978c14))
- **theme:** resolve theme color not updating immediately for Switch components and progress bars ([#197](https://github.com/mkdir700/EchoPlayer/issues/197)) ([eed9ea2](https://github.com/mkdir700/EchoPlayer/commit/eed9ea2354f386d1f86f0ce17ce5bd1f74502da8))

### Features

- integrate session-backed HLS playback flow ([#200](https://github.com/mkdir700/EchoPlayer/issues/200)) ([ee972d1](https://github.com/mkdir700/EchoPlayer/commit/ee972d170d0f29c6a9bc34cd12b55dbbc100d2ec))
- intro backend for hls player ([2d34e7b](https://github.com/mkdir700/EchoPlayer/commit/2d34e7bc2ca3c289544698678e961d6505ecd7ee))
- optimize media-server build output to resources directory ([#201](https://github.com/mkdir700/EchoPlayer/issues/201)) ([1b8c28e](https://github.com/mkdir700/EchoPlayer/commit/1b8c28e3e265ab9b9bf7d5bb1122c6fe221e998d))
- **player:** update seek button icons from rewind/fastforward to undo/redo ([#193](https://github.com/mkdir700/EchoPlayer/issues/193)) ([1612c43](https://github.com/mkdir700/EchoPlayer/commit/1612c438cdf4585b43bc7827a5d41adcf6e9ebe3))

# 1.0.0 (2025-09-17)

### Bug Fixes

- **build:** correct alpha channel update file naming ([#79](https://github.com/mkdir700/EchoPlayer/issues/79)) ([95e2ed2](https://github.com/mkdir700/EchoPlayer/commit/95e2ed262d6f29d2a645033089afe36a24afd56f))
- **build:** Fix FFmpeg cross-platform build on macOS for Windows targets ([#145](https://github.com/mkdir700/EchoPlayer/issues/145)) ([2a0b3a5](https://github.com/mkdir700/EchoPlayer/commit/2a0b3a5491a6906ce2714494dfd6f8954997d75e))
- **build:** 修复 Linux 构建产物架构命名转换问题 ([1f732ba](https://github.com/mkdir700/EchoPlayer/commit/1f732ba84ed69c803c6795c19ae7b5a2e11c3b70))
- **ci:** Failed to get next version ([a63caa3](https://github.com/mkdir700/EchoPlayer/commit/a63caa3acc7bbe2b31bedeaf58cb66ca9bbff009))
- **ci:** resolve duplicate GitHub releases issue ([#90](https://github.com/mkdir700/EchoPlayer/issues/90)) ([3e0117e](https://github.com/mkdir700/EchoPlayer/commit/3e0117eb2ad86af635915484090aafc4290422a5))
- **ci:** resolve GitHub Release creation issue with always publish strategy ([#85](https://github.com/mkdir700/EchoPlayer/issues/85)) ([712f0e8](https://github.com/mkdir700/EchoPlayer/commit/712f0e8cc8c11241678334c80e95f778055f57b2))
- **ci:** resolve semantic-release configuration issues ([#88](https://github.com/mkdir700/EchoPlayer/issues/88)) ([0a9e4a3](https://github.com/mkdir700/EchoPlayer/commit/0a9e4a3eb4501ade7aa25f377baab627de27b872))
- **ci:** resolve Windows build shell syntax compatibility issue ([#84](https://github.com/mkdir700/EchoPlayer/issues/84)) ([59b8460](https://github.com/mkdir700/EchoPlayer/commit/59b846044060a4c6ddd82c490c3c8706fe9daac7))
- **ci:** sync package.json version with manual trigger input ([#116](https://github.com/mkdir700/EchoPlayer/issues/116)) ([7008b6a](https://github.com/mkdir700/EchoPlayer/commit/7008b6a2f6a1369ab4ff1d547d517c4c537a82cb))
- **dictionary:** support pronunciation extraction without UK/US distinction ([#172](https://github.com/mkdir700/EchoPlayer/issues/172)) ([bfc6bb7](https://github.com/mkdir700/EchoPlayer/commit/bfc6bb754a1d9d840d67297d58c2d65799954cec))
- fix type check ([eae1e37](https://github.com/mkdir700/EchoPlayer/commit/eae1e378262d1f9162fd630cbb6dd867df933fb3))
- Fix TypeScript build errors and improve type safety ([#77](https://github.com/mkdir700/EchoPlayer/issues/77)) ([7861279](https://github.com/mkdir700/EchoPlayer/commit/7861279d8d5fd8c8e3bd5d5639f8e4b8f999b0ca))
- **homepage:** Fix UI desynchronization issue after deleting video records + i18n support ([#120](https://github.com/mkdir700/EchoPlayer/issues/120)) ([57b872d](https://github.com/mkdir700/EchoPlayer/commit/57b872dd7799d76ed8d0ff109663a9db4130f18b))
- improve release workflow and build configuration ([#91](https://github.com/mkdir700/EchoPlayer/issues/91)) ([2d9347f](https://github.com/mkdir700/EchoPlayer/commit/2d9347f6af5be076f439025e0468209df27770e0))
- **logger:** optimize logger memory management and reduce high-frequency logging ([#156](https://github.com/mkdir700/EchoPlayer/issues/156)) ([0a53c64](https://github.com/mkdir700/EchoPlayer/commit/0a53c641e34f1396576e8612bc0d249e6980e076))
- **player:** ensure video always starts paused and sync UI state correctly ([#102](https://github.com/mkdir700/EchoPlayer/issues/102)) ([83a0674](https://github.com/mkdir700/EchoPlayer/commit/83a067403e76f058e23a031cb5e96711441cf1d7))
- **player:** Fix subtitle navigation when activeCueIndex is -1 ([#119](https://github.com/mkdir700/EchoPlayer/issues/119)) ([05772a0](https://github.com/mkdir700/EchoPlayer/commit/05772a00010c9404291bf4e61b0a5e1b4617ccca))
- **player:** Fix subtitle overlay dragging to bottom and improve responsive design ([#122](https://github.com/mkdir700/EchoPlayer/issues/122)) ([a8a98db](https://github.com/mkdir700/EchoPlayer/commit/a8a98db1c355fa55dd8485f22b5e281cbd1c4069))
- **player:** improve play/pause button reliability ([#141](https://github.com/mkdir700/EchoPlayer/issues/141)) ([28f1156](https://github.com/mkdir700/EchoPlayer/commit/28f1156ff65798b73d4cfa57f9b65c33eb6996a5))
- **player:** improve subtitle overlay positioning and remove i18n dependencies ([#109](https://github.com/mkdir700/EchoPlayer/issues/109)) ([f7e8346](https://github.com/mkdir700/EchoPlayer/commit/f7e8346a8a7aa902eb6b5f9acfd0469888fd2ab5))
- **player:** integrate volume state in player engine context ([5ff32d9](https://github.com/mkdir700/EchoPlayer/commit/5ff32d91ce39d9499ae762ee433e61461e926c46))
- **player:** persist relocated video file path to database ([#162](https://github.com/mkdir700/EchoPlayer/issues/162)) ([bf76a18](https://github.com/mkdir700/EchoPlayer/commit/bf76a18faca7e80f74dd62d4d0e6c9f3369d3016))
- **player:** Prevent subtitle overlay interactions from triggering video play/pause ([#128](https://github.com/mkdir700/EchoPlayer/issues/128)) ([b1ae69c](https://github.com/mkdir700/EchoPlayer/commit/b1ae69cf934a8bff46ea4549fa6709896ac550a8))
- **player:** resolve focus loss after dictionary popup interaction ([#173](https://github.com/mkdir700/EchoPlayer/issues/173)) ([b2d577d](https://github.com/mkdir700/EchoPlayer/commit/b2d577d9b9787388e08c8bef98fa079120c35aae))
- **player:** resolve shortcut pause failure caused by state oscillation ([#174](https://github.com/mkdir700/EchoPlayer/issues/174)) ([6716c5b](https://github.com/mkdir700/EchoPlayer/commit/6716c5b6db4d558be1a4db70ad3e30f25ae2790d)), closes [#170](https://github.com/mkdir700/EchoPlayer/issues/170)
- **player:** resolve spacebar shortcut not working after clicking to pause ([#182](https://github.com/mkdir700/EchoPlayer/issues/182)) ([3e46a69](https://github.com/mkdir700/EchoPlayer/commit/3e46a698ab08e9620c5c7dc4bff282658bc73e69))
- **release:** remove custom labels from GitHub release assets ([#92](https://github.com/mkdir700/EchoPlayer/issues/92)) ([848bace](https://github.com/mkdir700/EchoPlayer/commit/848bace4b659102a246a05518b8912c187fb730e))
- remove cheerio dependency to resolve Electron packaging issues - Remove cheerio and @types/cheerio from package.json dependencies - Replace cheerio-based HTML parsing with native regex implementation - Refactor parseEudicHtml() to parseEudicHtmlWithRegex() in dictionaryHandlers.ts - Support multiple HTML formats: list items, phonetics, examples, translations - Delete related test files that depend on cheerio - Fix TypeScript type errors for regex variables - Improve Electron runtime compatibility and reduce bundle size Fixes [#50](https://github.com/mkdir700/EchoPlayer/issues/50) ([b01fe4e](https://github.com/mkdir700/EchoPlayer/commit/b01fe4e33a0027d3c4fc6fdbb7e5577fb7f4165b))
- remove path unique constraint to allow duplicate video file addition ([#97](https://github.com/mkdir700/EchoPlayer/issues/97)) ([31c1486](https://github.com/mkdir700/EchoPlayer/commit/31c1486edd07fd34473f27b5e4110f42287cbf8a))
- **renderer:** resolve subsrt dynamic require issue in production build ([#78](https://github.com/mkdir700/EchoPlayer/issues/78)) ([028a8fb](https://github.com/mkdir700/EchoPlayer/commit/028a8fb9a9446ebb8dc7b25fb4a70fadc02fb085))
- resolve dead links in documentation and add missing pages ([fc36263](https://github.com/mkdir700/EchoPlayer/commit/fc3626305bdbf96c0efc70ae9d989ba02a0ededa))
- **subtitle:** improve ASS subtitle parsing for bilingual text ([#111](https://github.com/mkdir700/EchoPlayer/issues/111)) ([85b7f82](https://github.com/mkdir700/EchoPlayer/commit/85b7f82d40ce2008bfb91d6962f80eca51a22d55))
- **subtitle:** prevent overlay showing content during subtitle gaps ([#138](https://github.com/mkdir700/EchoPlayer/issues/138)) ([6f03bb8](https://github.com/mkdir700/EchoPlayer/commit/6f03bb849ecc0d9bc1de08502468ac6bc26694b4))
- **subtitle:** resolve overlay pause/seek update delays with immediate state sync ([#153](https://github.com/mkdir700/EchoPlayer/issues/153)) ([1672720](https://github.com/mkdir700/EchoPlayer/commit/1672720eb711f2d3741612915a6316016a6661cc))
- **test:** resolve SubtitleLibraryDAO schema validation and test framework improvements ([#80](https://github.com/mkdir700/EchoPlayer/issues/80)) ([4be2b8a](https://github.com/mkdir700/EchoPlayer/commit/4be2b8a390c454dc1b0287e352d15ceedb4ed67b))
- **titlebar:** keep title bar fixed at top during page scroll ([b3ff5c2](https://github.com/mkdir700/EchoPlayer/commit/b3ff5c2c6b5a8bea67da69b8e82c9200d5eb05fd))
- **ui:** Remove white border shadow from modal buttons in dark mode ([#124](https://github.com/mkdir700/EchoPlayer/issues/124)) ([eb22660](https://github.com/mkdir700/EchoPlayer/commit/eb22660417aa8a490be002a688f25890479a7915))
- **ui:** use system title bar for Windows and Linux platforms ([#158](https://github.com/mkdir700/EchoPlayer/issues/158)) ([4075b9c](https://github.com/mkdir700/EchoPlayer/commit/4075b9cfad7d33c203463f0a5ae473b55cb08041))
- **updater:** remove detailed release notes from system update dialog ([#152](https://github.com/mkdir700/EchoPlayer/issues/152)) ([f998d7b](https://github.com/mkdir700/EchoPlayer/commit/f998d7b4a48b14fe0b1c826226804ceba366f67e))
- **updater:** resolve auto-update channel handling and version-based test defaults ([#98](https://github.com/mkdir700/EchoPlayer/issues/98)) ([e92c7f0](https://github.com/mkdir700/EchoPlayer/commit/e92c7f07e946a1ddd0c257df9ca81868cd63d1b5))
- **updater:** resolve pre-release version detection issue ([#161](https://github.com/mkdir700/EchoPlayer/issues/161)) ([0afad9e](https://github.com/mkdir700/EchoPlayer/commit/0afad9ed9754ca500d84e9db6cf3670f578b9f75))
- **windows:** resolve file extension validation requiring double dots (.mp4 vs ..mp4) ([#126](https://github.com/mkdir700/EchoPlayer/issues/126)) ([91bab14](https://github.com/mkdir700/EchoPlayer/commit/91bab14afe7cc7aff0629f51e707995b01f98ce7)), closes [#118](https://github.com/mkdir700/EchoPlayer/issues/118) [#118](https://github.com/mkdir700/EchoPlayer/issues/118)
- 优化文件路径处理逻辑以支持不同平台 ([dc4e1e3](https://github.com/mkdir700/EchoPlayer/commit/dc4e1e384588dac7e1aacc27eccf165fe2e43e4d))
- 修复 settings 相关组件找不到的问题 ([08f88ba](https://github.com/mkdir700/EchoPlayer/commit/08f88bad7099ac110a0bae109b3501a0348f0b78))
- 修复全屏模式下速度选择窗口溢出的问题 ([6309046](https://github.com/mkdir700/EchoPlayer/commit/63090466881d8df3e5dc062c0f235995dfe4134e))
- 修复在 Windows 上的 FFmpeg 文件下载和 ZIP 解压 ([6347b4e](https://github.com/mkdir700/EchoPlayer/commit/6347b4e62207dc104a1fa44f27af08667ff893a2))
- 修复在启用单句循环模式下，无法调整到下一句的问题 ([ec479be](https://github.com/mkdir700/EchoPlayer/commit/ec479beeff5c931821eed5aaffeaa054226b13c2))
- 修复文件路径处理逻辑以支持不同的 file URL 前缀 ([740015d](https://github.com/mkdir700/EchoPlayer/commit/740015d955f8266b96d2aa49bdc244d084937355))
- 修复方向键冲突检测问题 ([4a466c7](https://github.com/mkdir700/EchoPlayer/commit/4a466c7367860120d9a4ccc6f23ab5e79a2d8cae))
- 修复无法通过按钮退出全屏模式的问题 ([e69562b](https://github.com/mkdir700/EchoPlayer/commit/e69562b9ead8ea66c0933ad21b5cbeae3d88142f))
- 修复构建产物架构冲突问题 ([2398bd7](https://github.com/mkdir700/EchoPlayer/commit/2398bd78be4526a9f3f636c8f945df644bbc3d5b))
- 修复组件导出语句和优化字幕加载逻辑，移除未使用的状态 ([39708ce](https://github.com/mkdir700/EchoPlayer/commit/39708ce48bd6652488abce7d21752a2afe994d99))
- 删除上传到 cos 的步骤，因为网络波动问题上传失败 ([1cac918](https://github.com/mkdir700/EchoPlayer/commit/1cac918f21ad3198827138512ee61d770bd1367f))
- 在 UpdateNotification 组件中添加关闭对话框的逻辑，确保用户在操作后能够顺利关闭对话框 ([845a070](https://github.com/mkdir700/EchoPlayer/commit/845a070ac74b513ce5bda3cdc3d3e7a803a3b8d1))
- 始终在脚本直接执行时运行主函数，确保功能正常 ([a15378a](https://github.com/mkdir700/EchoPlayer/commit/a15378a914e54967f50642e04a111af184255344))
- 忽略依赖项警告 ([fc3f038](https://github.com/mkdir700/EchoPlayer/commit/fc3f038bb7d9b7e6962a5346bee00c858998ade0))
- 更新主题样式，使用 token 中的 zIndex 替代硬编码值 ([3940caf](https://github.com/mkdir700/EchoPlayer/commit/3940caf3b768efcba2043b3734bc7c7962f8c5a8))
- 更新测试文件中的 useTheme 和 useVideoPlaybackHooks 的路径 ([4fa9758](https://github.com/mkdir700/EchoPlayer/commit/4fa9758ae7bcb26789e8a458312ef23d577a34e6))
- 移除构建和发布工作流中的空选项，始终将草稿发布设置为 true，以确保发布过程的一致性 ([171028a](https://github.com/mkdir700/EchoPlayer/commit/171028adff214b3c696b7aaacb617c7c41b0302b))

### Features

- add API communication type definitions and unified export ([ea9f1c0](https://github.com/mkdir700/EchoPlayer/commit/ea9f1c0690d3b7fe5f6a2e2406b5fb88817aa8d1))
- add common base type definitions and interfaces for application ([73bd604](https://github.com/mkdir700/EchoPlayer/commit/73bd6046239341716eea727d95b316e9a3652ec8))
- add debounce hooks and corresponding tests ([7646088](https://github.com/mkdir700/EchoPlayer/commit/7646088b78106e40f00ff15a3cdd86b44aa541cc))
- add domain type definitions and constants for video, subtitle, playback, and UI ([a1c3209](https://github.com/mkdir700/EchoPlayer/commit/a1c3209271336891e0e9dbde444abc8c4e7d8e4b))
- add git hooks with lint-staged for automated code quality checks ([1311af9](https://github.com/mkdir700/EchoPlayer/commit/1311af96159b7e7b5d31f43f27f479cc9035d5a5))
- add handler to read directory contents ([6ce1d9e](https://github.com/mkdir700/EchoPlayer/commit/6ce1d9eff64968cef3a5673a67f8753de582d501))
- add IPC Client Service implementation with integration tests ([fe4400f](https://github.com/mkdir700/EchoPlayer/commit/fe4400ff63ff0640f32ca94f0b4d0d4c47b246ed))
- add performance optimization hooks and corresponding tests ([d7e1d0f](https://github.com/mkdir700/EchoPlayer/commit/d7e1d0f006dfe8c6c58a20bb0305621a657c9a65))
- add selectors for subtitle, UI, and video states with computed properties and hooks ([c64f41d](https://github.com/mkdir700/EchoPlayer/commit/c64f41dd27496bd311ff588474041e4ebacbd3a9))
- Add service layer type definitions for storage, video, subtitle, and dictionary services ([c658217](https://github.com/mkdir700/EchoPlayer/commit/c658217a5acc7e8a066004e6d7c1cd103be43a3b))
- add subtitle, UI, and video state actions for V2 ([1a4042a](https://github.com/mkdir700/EchoPlayer/commit/1a4042af3e1e917d6303a560c49e4aa8d52300ab))
- add unified export for V2 infrastructure layer type system ([ad94ea8](https://github.com/mkdir700/EchoPlayer/commit/ad94ea849bc17b5e569bd2296cf73c30ca06747d))
- add V2 state stores with type-safe validation and comprehensive documentation ([264cc66](https://github.com/mkdir700/EchoPlayer/commit/264cc661c2be83c9d886ba673d104b499ade0729))
- add Windows ARM64 architecture support ([#157](https://github.com/mkdir700/EchoPlayer/issues/157)) ([3d5152d](https://github.com/mkdir700/EchoPlayer/commit/3d5152dcfd11e59cdc81ebbd93d91cd11b056af6))
- **api:** add request and response type definitions for video, subtitle, file operations, and playback settings ([c0e9324](https://github.com/mkdir700/EchoPlayer/commit/c0e9324642d6920def8dcb79a97c92ab0f552397))
- **AutoResumeCountdown:** add auto-dismissal when playback manually resumed ([3852bca](https://github.com/mkdir700/EchoPlayer/commit/3852bca30af23c203698bc413e0b482a595c96d6))
- **ci:** add alpha and beta branch support to test workflow ([#94](https://github.com/mkdir700/EchoPlayer/issues/94)) ([f3cb1aa](https://github.com/mkdir700/EchoPlayer/commit/f3cb1aa1219f13721ad3169f8fd3ef45ba5b938d))
- **ci:** add dynamic workflow names to show release version in actions list ([#115](https://github.com/mkdir700/EchoPlayer/issues/115)) ([5742ac8](https://github.com/mkdir700/EchoPlayer/commit/5742ac893549dc148085fbb2c519013faeb5a1b2))
- **ci:** configure CodeRabbit for alpha, beta, and main branch PR reviews ([#108](https://github.com/mkdir700/EchoPlayer/issues/108)) ([074e94d](https://github.com/mkdir700/EchoPlayer/commit/074e94d23d9622adf588ffc659b60a6b24a15aac))
- **ci:** implement semantic-release with automatic version detection ([#117](https://github.com/mkdir700/EchoPlayer/issues/117)) ([39b69fd](https://github.com/mkdir700/EchoPlayer/commit/39b69fd6592c91c24440ad1affd49f82dcc40cf0))
- **ci:** implement semantic-release with three-branch strategy ([#89](https://github.com/mkdir700/EchoPlayer/issues/89)) ([5c6d4c5](https://github.com/mkdir700/EchoPlayer/commit/5c6d4c5a44b39e7b4b9199bb482547e225bc1994))
- **ci:** integrate semantic-release automation with GitHub workflow ([#87](https://github.com/mkdir700/EchoPlayer/issues/87)) ([874bd5a](https://github.com/mkdir700/EchoPlayer/commit/874bd5a0987c5944c14926230b32a49b4886158b))
- **ci:** migrate from action-gh-release to native electron-builder publishing ([#82](https://github.com/mkdir700/EchoPlayer/issues/82)) ([eab9ba1](https://github.com/mkdir700/EchoPlayer/commit/eab9ba1f1d8cc55d4cf6e7e6c3c8633b02938715))
- comprehensive auto-update system implementation ([#73](https://github.com/mkdir700/EchoPlayer/issues/73)) ([0dac065](https://github.com/mkdir700/EchoPlayer/commit/0dac065d54643bc761c741bae914057b9784e419))
- **ControllerPanel:** add disabled state for Loop and AutoPause controls when subtitles are empty ([a35f3e6](https://github.com/mkdir700/EchoPlayer/commit/a35f3e6cbf5c33ee4ebc6ca21dfb31a5b2b1b1a6))
- **ControllerPanel:** implement centralized menu management system for player controls ([1523758](https://github.com/mkdir700/EchoPlayer/commit/152375846dc6d5acf84d07a0d182160e29de4358))
- **db:** implement complete SQLite3 database layer with migrations and DAOs ([0a8a7dd](https://github.com/mkdir700/EchoPlayer/commit/0a8a7ddb5a240c6d6c145b4cfa0790e2292d3697))
- **db:** migrate from Dexie to Kysely with better-sqlite3 backend ([6b75cd8](https://github.com/mkdir700/EchoPlayer/commit/6b75cd877bd117b84d6205eb1c680450042b6eaa))
- define domain types for video, subtitle, and UI, and refactor RecentPlayItem interface imports ([f632beb](https://github.com/mkdir700/EchoPlayer/commit/f632beba5f9b20afb2ec6fc8e6df7dcba6fd29f0))
- **dictionary:** expose DictionaryService API in preload and add comprehensive tests ([#143](https://github.com/mkdir700/EchoPlayer/issues/143)) ([58fe719](https://github.com/mkdir700/EchoPlayer/commit/58fe7192dff218488b91258f974daa1430427710))
- enhance macOS build configuration with additional entitlements and notarization support ([d6e8ced](https://github.com/mkdir700/EchoPlayer/commit/d6e8ced7611b9f09743bc29344c6a0020ed0b19d))
- **ffmpeg:** add China mirror support for FFmpeg downloads ([#164](https://github.com/mkdir700/EchoPlayer/issues/164)) ([8a53634](https://github.com/mkdir700/EchoPlayer/commit/8a53634c59c602acdde9f60c7982e3a369a634a0))
- **ffmpeg:** implement dynamic FFmpeg download system with runtime management ([#155](https://github.com/mkdir700/EchoPlayer/issues/155)) ([161c8c7](https://github.com/mkdir700/EchoPlayer/commit/161c8c744e7ea0647f61e1c00021843d26d4c19a))
- **ffmpeg:** integrate bundled FFmpeg with automatic fallback mechanism ([#112](https://github.com/mkdir700/EchoPlayer/issues/112)) ([e826ad2](https://github.com/mkdir700/EchoPlayer/commit/e826ad2b0066c39b9599807b4ff830fb5646d93f))
- **home:** implement empty state with video file selection integration ([b6f6e40](https://github.com/mkdir700/EchoPlayer/commit/b6f6e401f622f1390926eb154f47fad812d5d0a7))
- implement Ctrl+C subtitle copy with lightweight toast notification ([#140](https://github.com/mkdir700/EchoPlayer/issues/140)) ([e497f86](https://github.com/mkdir700/EchoPlayer/commit/e497f86cf3049634b0e7338f46766d5a2f2bf824)), closes [#142](https://github.com/mkdir700/EchoPlayer/issues/142)
- Implement dictionary engine framework ([0d74a83](https://github.com/mkdir700/EchoPlayer/commit/0d74a8315f86209c530ad2f306b6099e97328c1f))
- implement useThrottle hooks and corresponding tests ([da30344](https://github.com/mkdir700/EchoPlayer/commit/da303443b6847fe049be9c4592c98418aeea9785))
- implement version parsing and channel mapping logic ([8c95a2f](https://github.com/mkdir700/EchoPlayer/commit/8c95a2feeef1d066fb46f246724d8a94014fa627))
- **infrastructure:** add entry points for constants and shared modules, and refine video playback rate type ([94da255](https://github.com/mkdir700/EchoPlayer/commit/94da2556dd6909eec75d4edfe2b549e3858e2629))
- **logger:** export logger instance for easier access in modules ([5328152](https://github.com/mkdir700/EchoPlayer/commit/5328152999408cbec0515e501aea9f393032b933))
- **performance:** implement video import performance optimization with parallel processing and warmup strategies ([#121](https://github.com/mkdir700/EchoPlayer/issues/121)) ([e7fa955](https://github.com/mkdir700/EchoPlayer/commit/e7fa955d61fe42c7e4dd262a9ca47240d2871efc))
- **persistence:** add V2 state persistence manager and configuration files ([a545020](https://github.com/mkdir700/EchoPlayer/commit/a545020f3f676b526b3f3bf3ecff6d23c4c1a471))
- **playback:** update playback rate label for clarity and add storage type definitions ([5c40b98](https://github.com/mkdir700/EchoPlayer/commit/5c40b983ea22c1e57e5e678922c5d6492a39359c))
- player page ([aa79279](https://github.com/mkdir700/EchoPlayer/commit/aa792799580524ac65c8bf7e4d9bc7e13988a716))
- **player,logging,state:** orchestrated player engine with intent strategies and new controller panel ([73d7cfd](https://github.com/mkdir700/EchoPlayer/commit/73d7cfdc4b58f190afe8981eddadbca54c6763b0))
- **player:** add Ctrl+] shortcut for subtitle panel toggle ([#69](https://github.com/mkdir700/EchoPlayer/issues/69)) ([e1628f2](https://github.com/mkdir700/EchoPlayer/commit/e1628f2d04ea03cac20893960a3a9fec2dd9fdb2))
- **player:** comprehensive dictionary popover with pronunciation and theme support ([#171](https://github.com/mkdir700/EchoPlayer/issues/171)) ([1987f61](https://github.com/mkdir700/EchoPlayer/commit/1987f61128f2d6cdb23ac4741d6e64cf6dda1867))
- **player:** hide sidebar and optimize navbar for player page ([#70](https://github.com/mkdir700/EchoPlayer/issues/70)) ([5bb71e4](https://github.com/mkdir700/EchoPlayer/commit/5bb71e4465721c3b1f0dc326f9a92e879e1c048b))
- **player:** implement auto-resume countdown with UI notification ([5468f65](https://github.com/mkdir700/EchoPlayer/commit/5468f6531c3e2f3d8aaf94f631ec4f760d04241f))
- **player:** implement comprehensive video error recovery ([#113](https://github.com/mkdir700/EchoPlayer/issues/113)) ([1e27033](https://github.com/mkdir700/EchoPlayer/commit/1e27033a7306670dd12641d172cc85522ee8627f))
- **player:** implement favorite playback rates with hover menu system ([#100](https://github.com/mkdir700/EchoPlayer/issues/100)) ([c742fab](https://github.com/mkdir700/EchoPlayer/commit/c742fab019e9f34f0504866372fe4f55db091cce))
- **player:** Implement fullscreen toggle functionality with keyboard shortcuts ([#127](https://github.com/mkdir700/EchoPlayer/issues/127)) ([586b064](https://github.com/mkdir700/EchoPlayer/commit/586b06472aa6f2d085716800e883eb6ca9d5de86))
- **player:** implement hover menu system for control panel components ([#99](https://github.com/mkdir700/EchoPlayer/issues/99)) ([de2363a](https://github.com/mkdir700/EchoPlayer/commit/de2363a3269bacbe5159228399335fd037a2e060))
- **player:** implement volume wheel control with intelligent acceleration ([#105](https://github.com/mkdir700/EchoPlayer/issues/105)) ([351439b](https://github.com/mkdir700/EchoPlayer/commit/351439b3e3bb7b5e3f2b23bf287ca7190fc0570d))
- **player:** reposition progress bar between video and controls ([#71](https://github.com/mkdir700/EchoPlayer/issues/71)) ([248feed](https://github.com/mkdir700/EchoPlayer/commit/248feed534974b6c05ef2918a3758ae5fed1f42d))
- refine RecentPlayItem interface with detailed video info and playback metrics ([81679b6](https://github.com/mkdir700/EchoPlayer/commit/81679b6eb54f7a8f07a33065c743fa51d1eecc5d))
- replace FFmpeg with MediaInfo for video metadata extraction ([#95](https://github.com/mkdir700/EchoPlayer/issues/95)) ([6326c80](https://github.com/mkdir700/EchoPlayer/commit/6326c8031e8411a61e434dff7596d835b6c67656))
- **scripts:** optimize FFmpeg download progress display ([#125](https://github.com/mkdir700/EchoPlayer/issues/125)) ([992c233](https://github.com/mkdir700/EchoPlayer/commit/992c233722eba9c2f8f7a3fe785267c91c10edd3))
- **search:** implement video search engine with live results and highlighting ([#110](https://github.com/mkdir700/EchoPlayer/issues/110)) ([e459afa](https://github.com/mkdir700/EchoPlayer/commit/e459afa0319632b32e6b80405a16fe154c61e5cb))
- setup GitHub Pages deployment for documentation ([b8a42b9](https://github.com/mkdir700/EchoPlayer/commit/b8a42b974d7490ddddb4292608315a58df14a24b))
- **sidebar:** 禁用收藏按钮并添加开发中提示 ([#81](https://github.com/mkdir700/EchoPlayer/issues/81)) ([76e9b54](https://github.com/mkdir700/EchoPlayer/commit/76e9b5418ec5f07f4d3052d8130163d108965f47))
- **SplashScreen:** add animated splash screen with typewriter effect and smooth transitions ([31cfeca](https://github.com/mkdir700/EchoPlayer/commit/31cfeca9f0773db12b9a7b299820a32c309d9daf))
- **startup:** implement configurable startup intro with preloading optimization ([#104](https://github.com/mkdir700/EchoPlayer/issues/104)) ([7964b51](https://github.com/mkdir700/EchoPlayer/commit/7964b51dc3897690e6244df5f3270934bc24a758))
- **state.store:** 新增多个 store ([54e7ff5](https://github.com/mkdir700/EchoPlayer/commit/54e7ff5993631c6133e21948c2697bcd13919df6))
- **state:** implement V2 state management infrastructure with storage engine, middleware, and utility functions ([e225746](https://github.com/mkdir700/EchoPlayer/commit/e22574659d1ec63fbc622152fec2371323b4fe53))
- **storage:** implement application configuration storage service ([1209b56](https://github.com/mkdir700/EchoPlayer/commit/1209b56fae690a9876440faa679f072cb2ebc6da))
- **subtitle-library:** Add subtitle data caching for improved loading performance ([#86](https://github.com/mkdir700/EchoPlayer/issues/86)) ([40be325](https://github.com/mkdir700/EchoPlayer/commit/40be325f09f9f70e702260dfe29e354c6c7435b6))
- **SubtitleContent:** implement word-level tokenization and interactive text selection ([10c0cdf](https://github.com/mkdir700/EchoPlayer/commit/10c0cdf38fdbad53bfba4b82148b635e45657b11))
- **telemetry:** integrate Sentry error monitoring across main and renderer processes ([#175](https://github.com/mkdir700/EchoPlayer/issues/175)) ([f71c2da](https://github.com/mkdir700/EchoPlayer/commit/f71c2da5c140398f5d3e4bb17ff9cafddb846adf))
- **types:** add Serializable interface for flexible data structures ([32981df](https://github.com/mkdir700/EchoPlayer/commit/32981df183af23d9153ae65765b9d1c8a533540e))
- **ui:** enhance video selection clarity and simplify display ([#101](https://github.com/mkdir700/EchoPlayer/issues/101)) ([051ed71](https://github.com/mkdir700/EchoPlayer/commit/051ed7113d16d9b890a617d1e248d7cdd87525be))
- update macOS notarization configuration to enable automatic notarization ([6630e79](https://github.com/mkdir700/EchoPlayer/commit/6630e79975a5d39eea83bec44ef1ff0271c984da))
- **updater:** integrate China-specific feed URLs for better update experience ([#177](https://github.com/mkdir700/EchoPlayer/issues/177)) ([4111cfb](https://github.com/mkdir700/EchoPlayer/commit/4111cfb4bf0db355177e58e5bbe5dd1c64516ae7))
- **video.store:** add format property to CurrentVideoState and update video loading simulation ([0349a63](https://github.com/mkdir700/EchoPlayer/commit/0349a6351ba8fa2a1235a48b268825ad18ea37ff))
- **VolumeControl:** change volume popup from horizontal to vertical layout ([d4d435b](https://github.com/mkdir700/EchoPlayer/commit/d4d435b93a72b8bb8e1f9d4fe356fa41632d8993))
- **workflow:** auto-fetch GitHub release description when manual trigger without description ([#179](https://github.com/mkdir700/EchoPlayer/issues/179)) ([9a9d932](https://github.com/mkdir700/EchoPlayer/commit/9a9d932c7644a5be08619c709e2f67153aa01324))
- **wsl:** add WSL detection and hardware acceleration optimization ([c99403e](https://github.com/mkdir700/EchoPlayer/commit/c99403efa8af9fa9ebf106edcbdc4a0d21b31b2e))
- 为字幕组件新增右键菜单功能 ([62334d5](https://github.com/mkdir700/EchoPlayer/commit/62334d56bb0956b28582d5d70e7ea0a3c2f9e42d))
- 为音量控制组件添加音量调节快捷键 ([144d49c](https://github.com/mkdir700/EchoPlayer/commit/144d49c314688c6b7b0abbdd0c21f57c98f3084d))
- 优化 PlayPage 组件性能，减少不必要的重新渲染；重构播放状态管理逻辑，提升用户体验 ([24a2ebc](https://github.com/mkdir700/EchoPlayer/commit/24a2ebc6d7c040ffce5ffc1a404f338ad77a6791))
- 优化最近观看记录加载状态显示 ([e5f7e11](https://github.com/mkdir700/EchoPlayer/commit/e5f7e11498d52028cf20765ea2fe486cca49f3d1))
- 优化单词查询逻辑，增加超时处理和取消请求功能，提升用户体验和性能 ([c98dc4b](https://github.com/mkdir700/EchoPlayer/commit/c98dc4b5d65bdc7c68d82f6e0c1bcda248929503))
- 优化字幕列表滚动体验 ([63807c5](https://github.com/mkdir700/EchoPlayer/commit/63807c5a4a668d5000c7c920dcae5eb96623314e))
- 优化字幕控制功能，新增字幕模式选择器，提升用户交互体验；重构相关组件，移除不必要的代码，简化逻辑 ([559aada](https://github.com/mkdir700/EchoPlayer/commit/559aada0c7d224bdbc941b30aa9da71b08d84636))
- 优化字幕文本分段逻辑 ([33e591c](https://github.com/mkdir700/EchoPlayer/commit/33e591c08ac1d520886b20b2b0219e15eeea1d0d))
- 优化字幕模式选择器组件，增强用户体验和视觉一致性，添加响应式设计和毛玻璃效果 ([4b59a1b](https://github.com/mkdir700/EchoPlayer/commit/4b59a1b0ac1d3a66dfd0c129177f2820722f2416))
- 优化快捷键设置界面，增强输入状态反馈，更新样式以提升用户体验和一致性 ([64db31c](https://github.com/mkdir700/EchoPlayer/commit/64db31cd8112b08f509e16ef653f687381f5f636))
- 优化日志记录功能，新增组件渲染节流和数据简化处理，提升性能和可读性 ([a6e8480](https://github.com/mkdir700/EchoPlayer/commit/a6e8480ecb2458eefd899d0828af3955f3cbef6e))
- 优化标题栏平台信息处理 ([fb5a470](https://github.com/mkdir700/EchoPlayer/commit/fb5a470084ed46f6f662e060d4cbca89fca1736e))
- 优化视频卡片和视频网格组件的样式与布局 ([af59b44](https://github.com/mkdir700/EchoPlayer/commit/af59b44aa7cefeb06dfd87656532af3652013574))
- 优化词典查询逻辑，增加未找到释义时的警告提示，并调整相关代码结构 ([9f528bd](https://github.com/mkdir700/EchoPlayer/commit/9f528bd89e905af2490c9c1b2db3d9a00b19e1f8))
- 优化进度条handler显示和对齐 ([77d0496](https://github.com/mkdir700/EchoPlayer/commit/77d04965d4ac4aa2bfff965fe2852c82d9e4c91e))
- 在 FullscreenTestInfo 组件中新增折叠功能 ([b2eac46](https://github.com/mkdir700/EchoPlayer/commit/b2eac461e616b3da6be84ceabaffd08c583d1b59))
- 在 HomePage 组件中新增音频兼容性诊断功能，优化视频播放体验；更新视频兼容性报告以支持音频编解码器检测；重构相关逻辑以提升代码可读性和维护性 ([3cac307](https://github.com/mkdir700/EchoPlayer/commit/3cac307f50c791b2f4f76b3e0aec7571d4e30a98))
- 在 SubtitleListContent 组件中引入 rc-virtual-list 以优化字幕列表渲染性能，增强自动滚动功能 ([30165dc](https://github.com/mkdir700/EchoPlayer/commit/30165dcf42f2770be23392f6c6d07a8d1786f95f))
- 在 UpdatePromptDialog 组件中添加内容展开/折叠功能 ([96d9b1f](https://github.com/mkdir700/EchoPlayer/commit/96d9b1f32b15abea3661836a684e177e774b80e5))
- 在构建和发布工作流中添加Windows、Mac和Linux平台的上传步骤，优化版本变量设置和上传路径逻辑 ([3cfacb9](https://github.com/mkdir700/EchoPlayer/commit/3cfacb91cd3c60428af09bdb1b1ed74be1538e29))
- 在构建和发布工作流中添加更新 package.json 版本的步骤，确保版本号自动更新；优化草稿发布条件以支持预发布版本 ([a78fbc7](https://github.com/mkdir700/EchoPlayer/commit/a78fbc72166e08eeec641c0970eebf83763aba39))
- 在构建和发布工作流中添加测试构建选项，更新版本变量设置和上传路径逻辑 ([2848f92](https://github.com/mkdir700/EchoPlayer/commit/2848f92f7216dee720d84608ffce2840f5f67bcd))
- 在视频上传时重置字幕控制状态，新增重置状态功能；更新快捷键设置以支持单句循环功能，优化用户体验 ([688dcd6](https://github.com/mkdir700/EchoPlayer/commit/688dcd6e7ddfe43499035fd828bcf26f04e08d79))
- 增强全屏模式下的样式支持 ([94a77b1](https://github.com/mkdir700/EchoPlayer/commit/94a77b1166173b73789d14daaba12d0b7de2790a))
- 增强全屏模式的快捷键支持 ([218882c](https://github.com/mkdir700/EchoPlayer/commit/218882cdbdd597dff7cf41df3dac9e0587b43dd0))
- 增强字幕显示组件，新增中文字符检测和智能文本分割功能，优化用户交互体验 ([8cd50d9](https://github.com/mkdir700/EchoPlayer/commit/8cd50d9df0e2884f27187bb0df66a2f0f3c232b2))
- 增强字幕空状态组件，支持拖拽文件导入 ([db1f608](https://github.com/mkdir700/EchoPlayer/commit/db1f60833f27b75594790387c0382cc30abd28fe))
- 增强字幕组件交互功能 ([3e7e8c7](https://github.com/mkdir700/EchoPlayer/commit/3e7e8c74651da43cbcd5e525ba76324e6c403fd8))
- 增强字幕组件和文本选择功能 ([36c44aa](https://github.com/mkdir700/EchoPlayer/commit/36c44aae0884e22030aae37db7424ac92e3f2c60))
- 增强快捷键设置功能，新增快捷键冲突检查和平台特定符号显示，优化用户输入体验和界面样式 ([bde034b](https://github.com/mkdir700/EchoPlayer/commit/bde034bccab0dec6dbeb305fd5c4b7aca76caa91))
- 增强更新通知系统，添加红点提示和用户交互逻辑 ([fdf4c81](https://github.com/mkdir700/EchoPlayer/commit/fdf4c811e2cf2611319adc6b706e12b5510fe5c8))
- 增强版本比较逻辑，优化更新通知系统 ([f29a25f](https://github.com/mkdir700/EchoPlayer/commit/f29a25fc4d9859375654c8c3e1f532224e8e3049))
- 增强视频兼容性模态框功能，支持初始步骤和分析结果 ([3aba45c](https://github.com/mkdir700/EchoPlayer/commit/3aba45c3464151598c1b8400c8e14d2c612f53bf))
- 多平台构建和发布 ([cc521ea](https://github.com/mkdir700/EchoPlayer/commit/cc521ea8befde2b839810292e93475a806db4dd1))
- 实现动态 electron-updater 渠道配置 ([28d2836](https://github.com/mkdir700/EchoPlayer/commit/28d28360a4e5cee11603cd68f959098d4e40ca0b)), closes [#3](https://github.com/mkdir700/EchoPlayer/issues/3)
- 将发布提供者从 generic 更改为 github，更新仓库和所有者信息，以支持自动更新功能 ([b6d4076](https://github.com/mkdir700/EchoPlayer/commit/b6d4076ff094f31d5f4eedf08e6b943f41f5fed6))
- 引入常量以支持视频容器格式检查 ([da68183](https://github.com/mkdir700/EchoPlayer/commit/da681831b60f4655b72731fd1ba34e5550149543))
- 新增 AimButton 组件以支持手动定位当前字幕并启用自动滚动；更新 SubtitleListContent 组件以集成 AimButton，优化用户滚动体验与字幕自动滚动逻辑 ([3c8a092](https://github.com/mkdir700/EchoPlayer/commit/3c8a09208d773f7a7e5d86bfb6a7ef26cfadf444))
- 新增 AppHeader 组件并更新样式，调整导航菜单布局以提升用户体验 ([94e35c3](https://github.com/mkdir700/EchoPlayer/commit/94e35c30ff96b534046190cbd654097f0b960095))
- 新增 cmd-reason.mdc 文件并更新 cmd-refactor-theme.mdc 规则 ([43d2222](https://github.com/mkdir700/EchoPlayer/commit/43d22225b7dd3546a90aec05ee5efb2dd158c8f6))
- 新增 E2E 测试用例和文件选择器助手 ([9928349](https://github.com/mkdir700/EchoPlayer/commit/99283494eddf4612fa0d9434473974337045b052))
- 新增 git commit 内容生成规则文件 ([6e0ee23](https://github.com/mkdir700/EchoPlayer/commit/6e0ee238be5d22aed2e23bf8cb4f51d5918d2a51))
- 新增主题系统 ([369d828](https://github.com/mkdir700/EchoPlayer/commit/369d828232f0e07d1212e750b961871fe8024a3f))
- 新增全屏模式支持 ([e8c9542](https://github.com/mkdir700/EchoPlayer/commit/e8c9542fef5766a048bd1fa65f11858cf1a44e7e))
- 新增全屏视频进度条组件并重构视频控制逻辑 ([7fc587f](https://github.com/mkdir700/EchoPlayer/commit/7fc587f93312c6d34869543ffab8153a20aa2975))
- 新增划词选中和快捷复制功能 ([9e22b44](https://github.com/mkdir700/EchoPlayer/commit/9e22b44a921ddea67f1ee95931c65116c619a9c2))
- 新增单词卡片组件，支持单词点击后显示详细信息和发音功能；优化字幕显示样式，提升用户交互体验 ([c6a4ab6](https://github.com/mkdir700/EchoPlayer/commit/c6a4ab6446e9ebc9e55d46b52d84e93987673706))
- 新增字幕列表上下文及相关钩子，重构播放页面以使用新的字幕管理逻辑，提升代码可读性与功能性 ([7766b74](https://github.com/mkdir700/EchoPlayer/commit/7766b74f5b7d472c94e78678f685ae1934e9c617))
- 新增字幕列表项样式并禁用焦点样式 ([654a0d1](https://github.com/mkdir700/EchoPlayer/commit/654a0d1d6581749a8c651d322444df60252dff38))
- 新增字幕布局锁定功能 ([82e75dc](https://github.com/mkdir700/EchoPlayer/commit/82e75dcb0741f6275fcf2863fccb6244383c75b2))
- 新增字幕模式覆盖层组件及相关逻辑 ([e75740c](https://github.com/mkdir700/EchoPlayer/commit/e75740cd20e588ae2542ece91acebd4f86206b51))
- 新增字幕空状态组件和外部链接打开功能 ([5bd4bd6](https://github.com/mkdir700/EchoPlayer/commit/5bd4bd6cb5f283114c83188c15301afe50b5d3c6))
- 新增字幕组件样式，重构相关组件以支持主题系统，提升视觉一致性和用户体验 ([822cb74](https://github.com/mkdir700/EchoPlayer/commit/822cb74a9348d89527f3871ba7d37f92952e3165))
- 新增字幕重置功能，优化字幕设置管理；重构相关组件以提升用户体验和代码可维护性 ([f4702a5](https://github.com/mkdir700/EchoPlayer/commit/f4702a5f59b77e36a8301c856c1ab81c3d8e26b5))
- 新增存储管理功能，添加最近播放项的增删改查接口，优化用户体验；重构相关组件，提升代码结构与可维护性 ([a746ed3](https://github.com/mkdir700/EchoPlayer/commit/a746ed388e2476c8a84f45ec13f7e5ab6af8ad82))
- 新增当前字幕显示上下文管理，优化字幕点击交互逻辑，确保用户体验流畅；重构相关组件以提升代码可维护性 ([91a215d](https://github.com/mkdir700/EchoPlayer/commit/91a215d0fa116f04c8f88403123574f0d6d7dd6f))
- 新增快捷键设置模态框和快捷键显示组件，优化用户输入体验 ([b605257](https://github.com/mkdir700/EchoPlayer/commit/b605257cd97fec50e58143eba479e39defe449b6))
- 新增控制弹窗样式并优化字幕模式选择器的交互体验；重构相关组件以提升代码可读性和用户体验 ([79eabdf](https://github.com/mkdir700/EchoPlayer/commit/79eabdfc684ba172425afc80dc61bb47ea95c78d))
- 新增播放设置上下文，重构相关组件以支持播放设置的管理；更新播放页面以使用新的播放设置上下文，提升代码可读性与功能性 ([6fe8b4f](https://github.com/mkdir700/EchoPlayer/commit/6fe8b4fed2d3ea0bf9b2487f48fe7bf98d293ba6))
- 新增播放速度覆盖层和相关功能 [#1](https://github.com/mkdir700/EchoPlayer/issues/1) ([d8637eb](https://github.com/mkdir700/EchoPlayer/commit/d8637eb6046ce8f24b0e4e08794681bf59a93ba9))
- 新增数据清理功能，优化日志记录中的数据序列化，确保记录的日志信息更为准确和安全 ([8ada21a](https://github.com/mkdir700/EchoPlayer/commit/8ada21a07acc9dcb06a59b205f9b42c326d6472f))
- 新增数据目录管理功能 ([2c93e19](https://github.com/mkdir700/EchoPlayer/commit/2c93e19e51efadcf0a91e55ae07b40c0589f2f2a))
- 新增日志系统，集成 electron-log 以支持主进程和渲染进程的日志记录；更新相关 API 以便于日志管理和调试 ([1f621d4](https://github.com/mkdir700/EchoPlayer/commit/1f621d42eaa8cce3ca13a1eec4c6fb5235a2d671))
- 新增智能分段功能及相关测试 ([f5b8f5c](https://github.com/mkdir700/EchoPlayer/commit/f5b8f5c96a00b64bc820335a3ed16083a7e44ce0))
- 新增视频UI配置管理功能 ([eaf7e41](https://github.com/mkdir700/EchoPlayer/commit/eaf7e418bf8d6ea7169f243e3afef5d2b8cb542a))
- 新增视频管理组件和确认模态框 ([4263c67](https://github.com/mkdir700/EchoPlayer/commit/4263c672a1bba108b83d80a1cfa78d71b6c6edb9))
- 新增视频转码功能及兼容性警告模态框 ([4fc86a2](https://github.com/mkdir700/EchoPlayer/commit/4fc86a28338e9814fb1b2c98780645cf23f35cda))
- 新增第三方服务配置组件，整合 OpenAI 和词典服务设置，优化用户界面和交互体验；引入模块化样式，提升整体一致性 ([3e45359](https://github.com/mkdir700/EchoPlayer/commit/3e45359efb188e7108ee4eb9663768b18b444678))
- 新增获取所有字幕的功能，优化字幕查找逻辑以支持根据当前时间查找上下句字幕，提升用户体验 ([04c5155](https://github.com/mkdir700/EchoPlayer/commit/04c5155f1276968967591acbaedb36200915a5cc))
- 新增词典服务相关的 IPC 处理器，支持有道和欧陆词典的 API 请求；实现 SHA256 哈希计算功能，增强应用的词典查询能力 ([707ee97](https://github.com/mkdir700/EchoPlayer/commit/707ee97b2680efcf9057acfd802e6113d4f89d8d))
- 新增边距验证逻辑，优化字幕拖拽和调整大小功能，确保字幕区域不超出容器边界 ([2294bcf](https://github.com/mkdir700/EchoPlayer/commit/2294bcffac6fc83e4d21e543c276cceaea0189ff))
- 更新 AppHeader 组件，增加背景装饰、应用图标和名称，优化导航按钮和辅助功能按钮的样式，提升用户体验 ([651c8d7](https://github.com/mkdir700/EchoPlayer/commit/651c8d79acf0649f24a30acc4a7a714f112ec85a))
- 更新 AppHeader 组件，调整文本样式和名称，提升视觉效果 ([f208d66](https://github.com/mkdir700/EchoPlayer/commit/f208d66199d33de47c8b3f885c6f95ca655081ac))
- 更新 GitHub Actions 工作流和文档，支持更多发布文件 ([c4bf6f7](https://github.com/mkdir700/EchoPlayer/commit/c4bf6f7a00d332a3e71f0796dbbdcf3c397ef175))
- 更新 index.html 文件，修改内容安全策略以支持新的脚本源，添加本地开发服务器的支持，优化页面加载逻辑 ([8c11edf](https://github.com/mkdir700/EchoPlayer/commit/8c11edfc841058448c24be872d641b98beda52ec))
- 更新 PlaybackRateSelector 组件样式和文本 ([034e758](https://github.com/mkdir700/EchoPlayer/commit/034e7581ec6facdffbd7cafc276449f7733c231b))
- 更新 SubtitleListContent 组件，替换 rc-virtual-list 为 react-virtualized，优化字幕列表渲染性能与用户体验；调整样式以适配虚拟列表，增强滚动效果与响应式设计 ([63d9ef4](https://github.com/mkdir700/EchoPlayer/commit/63d9ef4229b9e159b0da5ae272229d192cc27a25))
- 更新 SubtitleListContent 组件，添加激活字幕索引状态以优化渲染逻辑；重构字幕项组件以减少不必要的重渲染并提升性能；增强自动滚动逻辑，确保用户体验流畅 ([c997109](https://github.com/mkdir700/EchoPlayer/commit/c997109154faf0a92186bb94a8d2a019d85086e2))
- 更新E2E测试，移除冗余测试用例并优化测试ID使用 ([51fd721](https://github.com/mkdir700/EchoPlayer/commit/51fd721ecd84bf54472f18298e0541d20d0d1cb8))
- 更新E2E测试配置，添加Linux虚拟显示器支持并检查构建输出 ([ac1999f](https://github.com/mkdir700/EchoPlayer/commit/ac1999f8b30cf8cf48f9528b93b3fcb68b1c1b79))
- 更新主题系统，新增字体粗细、间距、圆角等设计令牌，优化组件样式一致性 ([62f87dd](https://github.com/mkdir700/EchoPlayer/commit/62f87dd4fc868eefaf7d26008204edde9e778bb4))
- 更新侧边栏导航功能和禁用状态提示 ([d41b25f](https://github.com/mkdir700/EchoPlayer/commit/d41b25f88d5a5b428b3a159db432fa951178a469))
- 更新最近播放项管理，使用文件ID替代原有ID，新增根据文件ID获取最近播放项的功能，优化播放设置管理，提升代码可维护性 ([920856c](https://github.com/mkdir700/EchoPlayer/commit/920856c095a8ac4d5d41dab635390493c13774ad))
- 更新图标文件，替换Mac和Windows平台的图标，优化SVG图标文件结构 ([bfe456f](https://github.com/mkdir700/EchoPlayer/commit/bfe456f9109fd99022796d8be8c533ba31c1fd9f))
- 更新图标资源，替换 PNG 格式图标并新增 SVG 格式图标，提升图标的可扩展性与清晰度 ([8eaf560](https://github.com/mkdir700/EchoPlayer/commit/8eaf5600cff468fceb1d36bca6416a52e43f9aa9))
- 更新字典引擎设置，默认选择为 'eudic-html'，提升用户体验 ([ebaa5d2](https://github.com/mkdir700/EchoPlayer/commit/ebaa5d290cbbfcd1c2a5f5d7b8ed99ce9bbad449))
- 更新字幕上下文菜单，优化重置按钮状态和样式 ([cc542f2](https://github.com/mkdir700/EchoPlayer/commit/cc542f27e241c920e80272cc2c68d2aaa7ba00da))
- 更新字幕列表项组件，添加注释以说明仅展示学习语言，优化双语字幕显示逻辑 ([89e2b33](https://github.com/mkdir700/EchoPlayer/commit/89e2b33e65f7565ee4b89a329963c66b29a78df6))
- 更新字幕加载功能，新增对 ASS/SSA 格式的支持；优化字幕文件扩展名和解析逻辑，提升用户体验 ([9cab843](https://github.com/mkdir700/EchoPlayer/commit/9cab843eeb33c3429ce1c2a9e78f33eeee743191))
- 更新字幕加载模态框样式，新增加载状态提示与取消功能；重构相关逻辑以提升用户体验与代码可读性 ([1f8442a](https://github.com/mkdir700/EchoPlayer/commit/1f8442a0f6eec1afd4421f520774b4132528a3a2))
- 更新字幕展示组件样式，添加浮动控制按钮及其样式，优化响应式设计 ([ac586e2](https://github.com/mkdir700/EchoPlayer/commit/ac586e2cd1e7670855b0b92bc3dc887ec9586658))
- 更新字幕控制功能，添加自动暂停选项，修改快捷键设置，优化相关逻辑和组件交互 ([428e4cf](https://github.com/mkdir700/EchoPlayer/commit/428e4cfc1ba2f3856e604dd82614388c1e2d09a0))
- 更新字幕模式选择器，整合字幕显示模式的获取逻辑，优化状态管理，增强调试信息 ([c2d3c90](https://github.com/mkdir700/EchoPlayer/commit/c2d3c90cfa07c64fbd4a21ef0ee962cc389b121f))
- 更新循环播放设置，支持无限循环和自定义次数 ([e6c5d2e](https://github.com/mkdir700/EchoPlayer/commit/e6c5d2e3b291b3e5e4c562e43da278673c51ae23))
- 更新快捷键设置，修改单句循环和字幕导航的快捷键，优化用户体验 ([ce66e62](https://github.com/mkdir700/EchoPlayer/commit/ce66e6208e920bc6d75a1750c06de27c2958f7cd))
- 更新总结规则，启用始终应用选项；新增指令处理逻辑以提取项目开发指导内容并编写开发文档，确保文档规范性 ([d627e2e](https://github.com/mkdir700/EchoPlayer/commit/d627e2ec7676413f96950f580a6cddc73c9ff325))
- 更新构建产物处理逻辑，支持多架构文件重命名和 YAML 文件引用更新 ([e206e1d](https://github.com/mkdir700/EchoPlayer/commit/e206e1d5386855e5819ce6b74000487d51aa2d77))
- 更新构建配置，支持多架构构建和文件重命名 ([17b862d](https://github.com/mkdir700/EchoPlayer/commit/17b862d57bde74e4cff8c4f89ae423b183b1e9ed))
- 更新样式文件，优化警告框和卡片组件的视觉效果，增强响应式设计支持 ([ea6b4ab](https://github.com/mkdir700/EchoPlayer/commit/ea6b4ab9142e5cade134113e613c69b109b86889))
- 更新滚动条样式以支持 WebKit 规范 ([224f41d](https://github.com/mkdir700/EchoPlayer/commit/224f41d853a274324d5d1bbbf4ac7d07214cca96))
- 更新视频上传钩子，使用日志系统记录视频DAR信息和错误警告，提升调试能力 ([2392b38](https://github.com/mkdir700/EchoPlayer/commit/2392b3806dfdf8134555a6b006ea833065459a09))
- 更新视频兼容性模态框样式，提升用户体验 ([f5c1ba5](https://github.com/mkdir700/EchoPlayer/commit/f5c1ba5e42d44d65b5c0df55c70e9e2f44cbb855))
- 更新视频播放器和播放状态管理逻辑，重构字幕处理方式，统一使用 subtitleItems 以提升代码一致性与可读性；优化播放状态保存与恢复机制，确保更流畅的用户体验 ([0cbe11d](https://github.com/mkdir700/EchoPlayer/commit/0cbe11d4324806dbdab67dd181ac28acd5e45c06))
- 更新视频播放器的时间跳转逻辑，支持来源标记 ([f170ff1](https://github.com/mkdir700/EchoPlayer/commit/f170ff1b508c40bb122a20262ba436e4132c77da))
- 更新视频文件信息样式，添加文件名截断功能，优化头部布局以提升用户体验 ([a6639f1](https://github.com/mkdir700/EchoPlayer/commit/a6639f1494862620bc0fec6f7e140e6bd773335f))
- 更新窗口管理和标题栏组件，优化样式和功能 ([a1b50f6](https://github.com/mkdir700/EchoPlayer/commit/a1b50f6c52142a9cc2c2df12b98644e1e11ddfa6))
- 更新窗口管理器的窗口尺寸和最小尺寸，优化用户界面；移除不必要的响应式设计样式，简化 CSS 结构 ([dd561cf](https://github.com/mkdir700/EchoPlayer/commit/dd561cf35995ebd504553a26d2c83b73da06e3f1))
- 更新第三方服务配置组件，修改标签和提示文本为中文，增强用户友好性；新增申请应用ID和密钥的链接提示，提升信息获取便利性 ([5e68e85](https://github.com/mkdir700/EchoPlayer/commit/5e68e8507f1d5509cdcb2fb3459a570d92287aa9))
- 更新设置导航组件样式和功能 ([535f267](https://github.com/mkdir700/EchoPlayer/commit/535f267b140bc918672fdadaae6445b9eda0707f))
- 更新设置页面，移除视频转换相关功能 ([0d96fac](https://github.com/mkdir700/EchoPlayer/commit/0d96facf476cd73aa64fd023fb01c3a2442d0dbe))
- 更新设置页面，简化快捷键和数据管理部分的渲染逻辑，新增存储设置选项，优化用户界面和交互体验 ([9942740](https://github.com/mkdir700/EchoPlayer/commit/9942740d9bca7ba55cd4f730ed2214ed405ed867))
- 更新设置页面样式和主题支持 ([816ca6d](https://github.com/mkdir700/EchoPlayer/commit/816ca6d3d747ace1a18cf5f01523ee56ab8cb120))
- 更新设置页面的按钮样式和移除音频兼容性警告 ([f0be1e2](https://github.com/mkdir700/EchoPlayer/commit/f0be1e206fb69f3a75ad292dc8c3a90f02fced14))
- 更新通知系统优化，增强用户交互体验 ([6df4374](https://github.com/mkdir700/EchoPlayer/commit/6df4374ceb90b401799107c344211b164f7a0164))
- 更新页面渲染逻辑，添加页面冻结功能，确保首页始终挂载并优化其他页面的条件渲染，提升用户体验 ([7a4b2ba](https://github.com/mkdir700/EchoPlayer/commit/7a4b2ba5d72a83f3765b003384d09295e70403e5))
- 替换应用头部为侧边栏组件 ([0e621fc](https://github.com/mkdir700/EchoPlayer/commit/0e621fca1703f7461a101d2899ce7d85626156ff))
- 沉浸式标题栏 ([9c7c7d9](https://github.com/mkdir700/EchoPlayer/commit/9c7c7d9b91ba0c505d72cc3cf2d11b9049bd62a3))
- 添加 @ant-design/v5-patch-for-react-19 支持 React19 ([95d1019](https://github.com/mkdir700/EchoPlayer/commit/95d1019a02fb244e558f8819e4c52e3a7b0bc1bf))
- 添加 Stagewise 工具栏支持，仅在开发模式下初始化，更新 CSP 设置以允许外部样式源 ([ededb64](https://github.com/mkdir700/EchoPlayer/commit/ededb643573969a41ebc57a9666fbfd928e44e7c))
- 添加Codecov配置文件，更新测试配置以支持覆盖率报告上传 ([d9ec00d](https://github.com/mkdir700/EchoPlayer/commit/d9ec00d895792eca2c9ad6ea455f5b1eaadb2078))
- 添加E2E测试支持，更新Playwright配置和相关脚本 ([247b851](https://github.com/mkdir700/EchoPlayer/commit/247b85122ab88b05e789388e18b696769256e226))
- 添加全屏功能支持，优化视频播放器组件，更新样式以移除不必要的自定义样式，提升用户体验 ([a7d4b1c](https://github.com/mkdir700/EchoPlayer/commit/a7d4b1c1408ec6177ec07c60280993f23af8c605))
- 添加字幕控制组件，支持单句循环和自动循环功能，更新快捷键设置，优化样式和响应式设计 ([2902f2d](https://github.com/mkdir700/EchoPlayer/commit/2902f2d54e929b433ba7dfa2ed9ebe32dc8b2d58))
- 添加应用图标 ([b86e142](https://github.com/mkdir700/EchoPlayer/commit/b86e1420b4ca8701354d644b45653ac039845db2))
- 添加应用图标并优化代码中的事件监听和清理逻辑 ([c39da08](https://github.com/mkdir700/EchoPlayer/commit/c39da08c7ab5a17ed4fb718bcfc10df4a2b94cb9))
- 添加当前字幕展示组件，支持多种字幕显示模式及单词hover交互，优化视频控制区样式和响应式设计 ([df4b74a](https://github.com/mkdir700/EchoPlayer/commit/df4b74a98c5ae66e6c2d3be24e25c7e4261fc70e))
- 添加循环播放功能，支持自定义循环次数设置 ([1dbccfa](https://github.com/mkdir700/EchoPlayer/commit/1dbccfae97c22ac49a08e78287211f89ccf3aa46))
- 添加文件系统相关的 IPC 处理器，支持文件存在性检查、读取文件内容、获取文件 URL、文件信息获取及文件完整性验证；更新 preload 和 renderer 逻辑以支持视频和字幕文件的选择与恢复功能，优化用户体验 ([6d361eb](https://github.com/mkdir700/EchoPlayer/commit/6d361eb0ec1e8f8aa2eaca5167736bd1373d93bb))
- 添加更新通知和提示对话框组件 ([38df4d2](https://github.com/mkdir700/EchoPlayer/commit/38df4d2b55af83f3007f1b242da19eb02cca8a11))
- 添加更新通知跳过版本功能，优化用户体验 ([165adb6](https://github.com/mkdir700/EchoPlayer/commit/165adb69c7a4dae1d2749592b01f1561580c58ec))
- 添加本地更新测试环境脚本和相关功能 ([00aa019](https://github.com/mkdir700/EchoPlayer/commit/00aa01940583ec30e79034495fe804febe4479ab))
- 添加构建产物重命名和验证脚本 - 新增 rename-artifacts.ts 用于重命名构建产物以符合发布要求 - 新增 verify-build-artifacts.ts 用于验证构建产物的存在性和完整性 ([696cedc](https://github.com/mkdir700/EchoPlayer/commit/696cedc090caaa56b3f2c4921022d9e131d361ac))
- 添加构建和发布工作流，更新测试和发布脚本 ([2744005](https://github.com/mkdir700/EchoPlayer/commit/2744005aefb85874651d7e7937e5af1f9ead8b35))
- 添加欧陆词典HTML解析服务和单元测试框架 ([52ace3e](https://github.com/mkdir700/EchoPlayer/commit/52ace3ef0ba4aa0b58d000996d1f933365c093ce))
- 添加测试Electron CDP连接的脚本 ([9982514](https://github.com/mkdir700/EchoPlayer/commit/9982514f56ccbb6b048d0a4d961f8a5b7b29eea0))
- 添加版本管理脚本，支持版本类型检测和版本号递增功能；更新构建和发布工作流，优化版本变量设置和上传路径逻辑；新增发布指南文档，详细说明版本管理和发布流程 ([282bde8](https://github.com/mkdir700/EchoPlayer/commit/282bde883d4c8ae965963e555feb1cd4a011ab88))
- 添加视频播放器点击事件处理，优化用户交互体验 ([69c378f](https://github.com/mkdir700/EchoPlayer/commit/69c378fad8aa8c15b29833e668fd150775c477e3))
- 添加视频文件选择加载状态和清空确认模态框 ([ca95a7d](https://github.com/mkdir700/EchoPlayer/commit/ca95a7d5f2cae1e42423dbe7cfe3c7d09352e16c))
- 添加视频格式转换功能，新增视频兼容性检测与转换指南，优化视频播放器与文件上传逻辑，提升用户体验；重构相关组件，简化代码结构 ([5fd89fe](https://github.com/mkdir700/EchoPlayer/commit/5fd89fed2b346efbb4d0e5c0d029af51e60f07a1))
- 添加腾讯云COS上传功能，支持发布文件和自动更新文件的上传 ([e79e5a9](https://github.com/mkdir700/EchoPlayer/commit/e79e5a9c5b5e29f2092d50aa9af58dafa6297612))
- 添加自动更新功能，整合更新处理器，更新设置界面，支持版本检查和下载 ([5e5a03e](https://github.com/mkdir700/EchoPlayer/commit/5e5a03e5966e3978ba16d76ed202ce943903e3a1))
- 添加页面切换过渡效果，优化播放页面与性能监控功能；重构相关组件，提升用户交互体验与代码结构 ([e583ecc](https://github.com/mkdir700/EchoPlayer/commit/e583ecc78836dc241392039c76092833ca354695))
- 添加页面导航功能，重构 App 组件以支持多页面切换，新增关于、收藏、设置等页面，优化样式和用户体验 ([51f4263](https://github.com/mkdir700/EchoPlayer/commit/51f426365c12474091e8581211da3e7e36d29749))
- 添加高效测试标识符管理指南及相关工具函数，优化E2E测试中的测试ID使用 ([2dcfe5e](https://github.com/mkdir700/EchoPlayer/commit/2dcfe5e7443095890acc7034a5b919059dcad2bc))
- 现代化视频控制组件，优化样式和交互逻辑，增强用户体验；添加音量和设置控制，支持自动隐藏功能 ([dc45b83](https://github.com/mkdir700/EchoPlayer/commit/dc45b83bbaf02f90ccde2559f203520b172a0388))
- 移除 HomePage 组件中的 subtitleIndex 属性，优化视频播放状态管理逻辑；调整视频网格布局以提升用户界面的一致性与可读性 ([8f54e7f](https://github.com/mkdir700/EchoPlayer/commit/8f54e7fb54574552a308c7af5188f5f46d5a37ce))
- 移除 PlayPageHeader 的 CSS 模块，改为使用主题系统样式管理，提升组件的可维护性和一致性 ([52cedbc](https://github.com/mkdir700/EchoPlayer/commit/52cedbc09e95d3fe91308e1bdc70a38d1c988315))
- 移除 useSidebarResize 钩子及相关样式，改用 Ant Design 的 Splitter 组件实现侧边栏调整功能，优化播放页面布局与用户体验 ([bead645](https://github.com/mkdir700/EchoPlayer/commit/bead645f2680363621a7cc7dd6139aa990aa7750))
- 移除字幕位置控制相关组件及其逻辑，简化视频控制界面以提升用户体验 ([1edc857](https://github.com/mkdir700/EchoPlayer/commit/1edc857e3ef1f8ac87c35e6c62f1bdfcd4b545c6))
- 移除字幕设置相关功能和组件 ([32f0138](https://github.com/mkdir700/EchoPlayer/commit/32f0138c6285b6a5805720c9306dad2d4cfd7783))
- 移除推荐视频假数据，更新欢迎信息，优化首页布局和用户体验 ([78b000f](https://github.com/mkdir700/EchoPlayer/commit/78b000fcf2bd8511ef35e79f5a03114dfed297d4))
- 移除视频播放器和播放控制钩子，简化代码结构以提升可维护性 ([513ba3c](https://github.com/mkdir700/EchoPlayer/commit/513ba3c21f67fbc76fc3a61ac5b128506cca68db))
- 移除视频播放器的响应式设计中不必要的内边距，简化 CSS 结构 ([f8c8c28](https://github.com/mkdir700/EchoPlayer/commit/f8c8c2899d8545486a23421d882ecfd1c186446c))
- 调整 HomePage 组件的响应式布局，优化列宽设置以提升用户体验 ([3c435bf](https://github.com/mkdir700/EchoPlayer/commit/3c435bfee87ab529333a2dcf3fe51553b089cc45))
- 调整主题样式宽度 ([2fe9ff2](https://github.com/mkdir700/EchoPlayer/commit/2fe9ff24d2f35791712b3bf5b848fc7464b08fef))
- 调整全屏视频控制组件的进度条位置和样式 ([679521f](https://github.com/mkdir700/EchoPlayer/commit/679521f2f92c1c04646a89866944b20d22d6a917))
- 调整字幕覆盖层样式，修改底部位置为0%，移除移动端特定样式，简化 CSS 结构 ([515151d](https://github.com/mkdir700/EchoPlayer/commit/515151d022fc16d886471aad43aeda43f482214c))
- 重命名视频控制组件为 VideoControlsFullScreen，更新相关导入，提升代码可读性 ([0fe7954](https://github.com/mkdir700/EchoPlayer/commit/0fe795404702dd1a9b68c32a21fec5ad003dcf8d))
- 重构 SidebarSection 和 SubtitleListContent 组件，简化属性传递，增强字幕索引处理逻辑，优化自动滚动功能；新增获取指定时间点字幕索引的功能，提升用户体验与代码可读性 ([dabcbeb](https://github.com/mkdir700/EchoPlayer/commit/dabcbeb0718e2f8d6923a223d3c57e79453366a9))
- 重构字幕控制组件样式，使用主题系统优化按钮和图标样式，提升视觉一致性和用户体验 ([12e38f2](https://github.com/mkdir700/EchoPlayer/commit/12e38f2f260467e297ad11831ff1a44eea08c317))
- 重构字幕状态管理，新增视频特定字幕设置 ([ff5b5de](https://github.com/mkdir700/EchoPlayer/commit/ff5b5def52690c082eae9f26029f6d139d80cd47))
- 重构字幕组件，新增字幕覆盖层和文本组件，优化字幕显示逻辑和性能；移除旧版字幕组件，提升代码可维护性 ([4fbef84](https://github.com/mkdir700/EchoPlayer/commit/4fbef8419f703f398593043932f07a14a78e170c))
- 重构存储处理器模块，优化应用配置和通用存储功能 ([065c30d](https://github.com/mkdir700/EchoPlayer/commit/065c30d7cbc8fc5b01f3f3b59211e6548d679cdc))
- 重构存储管理功能，更新最近播放项的类型定义，优化播放设置管理，增强用户体验；新增播放设置的深度合并逻辑，提升代码可维护性 ([3f928d4](https://github.com/mkdir700/EchoPlayer/commit/3f928d4c84df465574fde222fcb1dccf72c3dfc6))
- 重构应用布局与样式，新增主页与播放页面组件，优化用户交互体验；整合最近文件管理功能，提升视频文件选择与加载逻辑 ([f3fefad](https://github.com/mkdir700/EchoPlayer/commit/f3fefadd3643f20e2935d2d72eeea1e56a65a1d1))
- 重构循环切换功能，简化状态管理和播放逻辑 ([fe11037](https://github.com/mkdir700/EchoPlayer/commit/fe11037cb82119f3ff3e74c825a44e80022158f7))
- 重构播放状态管理，替换为使用最近播放列表钩子，简化参数传递并优化代码逻辑；新增最近播放列表钩子以支持播放项的增删改查功能 ([1ec2cac](https://github.com/mkdir700/EchoPlayer/commit/1ec2cac7f2a84f11b1ff4ddd2d482a45c8eae1bd))
- 重构播放页面，整合视频播放器与字幕控制逻辑，新增 VideoPlayerProvider 以管理视频播放状态，优化组件结构与性能；移除不再使用的 SubtitleControls 组件，简化属性传递，提升代码可读性 ([e4111c9](https://github.com/mkdir700/EchoPlayer/commit/e4111c9274cb6b6dd112c5dd7f629b244450f802))
- 重构视频控制组件，新增全屏控制样式与逻辑，优化播放控制体验；更新相关类型定义，提升代码可读性与功能性 ([5c72a1b](https://github.com/mkdir700/EchoPlayer/commit/5c72a1b0ce481c63b0d9c03f048b527f612052e0))
- 重构视频播放上下文，新增视频文件上传和选择功能；更新相关组件以支持新的上下文逻辑，提升代码可读性与功能性 ([37e128e](https://github.com/mkdir700/EchoPlayer/commit/37e128eede0ad02f70ee7dc2aa2aab7d49a121df))
- 重构视频播放器组件，移除 CSS Modules，采用主题系统样式管理，提升代码可维护性和一致性 ([b3981bc](https://github.com/mkdir700/EchoPlayer/commit/b3981bc2d86a7ea7d343f1e068f404b46af509f0))
- 重构视频播放器逻辑，整合视频播放状态管理，优化组件结构；移除不再使用的 usePlayingVideoContext 钩子，新增多个视频控制钩子以提升性能与可读性 ([b1a6dc2](https://github.com/mkdir700/EchoPlayer/commit/b1a6dc29acb83fbdf4a167c9ded069f2e53d0491))
- 重构视频播放设置管理，整合字幕显示设置，优化状态管理逻辑，提升用户体验和代码可维护性 ([6c3d852](https://github.com/mkdir700/EchoPlayer/commit/6c3d852fbb8d66e5f07942fdf792b661327b3a4a))
- 重构设置页面，新增快捷键、数据管理和占位符组件，优化用户界面和交互体验；引入快捷键上下文管理，支持自定义快捷键功能 ([a498905](https://github.com/mkdir700/EchoPlayer/commit/a4989050d3a747b6a66d7deb2da21a1cf9a2a0be))

### Reverts

- Revert "build: 在构建和发布工作流中添加调试步骤，列出下载的文件并检查Windows、Mac和Linux平台的自动更新配置文件是否存在" ([d0f8fc4](https://github.com/mkdir700/EchoPlayer/commit/d0f8fc4be0f3b976df0752a57437eb3cd16321ef))
- Revert "chore: 更新 Linux 构建环境配置" ([cc179a0](https://github.com/mkdir700/EchoPlayer/commit/cc179a072721fd508662924073cf03bdfa684611))
- Revert "feat: 在构建和发布工作流中添加更新 package.json 版本的步骤，确保版本号自动更新；优化草稿发布条件以支持预发布版本" ([be1cf26](https://github.com/mkdir700/EchoPlayer/commit/be1cf2668cf7ad777739bdb40e5b75e145775386))

### BREAKING CHANGES

- **ffmpeg:** Service now defaults to China mirror for
  better performance in Chinese regions

- fix(test): remove unused parameter in FFmpegDownloadService test

* Fix TypeScript error TS6133 for unused 'url' parameter
* Replace unused 'url' with underscore in mock implementation

- **player,logging,state:** - Removed TransportBar and deprecated hooks (usePlayerControls/useVideoEvents/useSubtitleSync). Migrate to ControllerPanel with usePlayerEngine/usePlayerCommandsOrchestrated.

* Player store control actions are engine-only; components should send commands via the orchestrator instead of mutating store directly.

## [v0.2.0-alpha.7](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.7)(2025-06-20)

### ⚙️ 构建优化

- 为 macOS 包签名以避免不信任警告

## [v0.2.0-alpha.6](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.6)(2025-06-14)

### 🐛 修复问题

- **构建修复**: 发布流程修复，尝试解决打包问题

## [v0.2.0-alpha.5](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.5)(2025-06-14)

### 🚀 新功能

- **自动更新**: 新增自动更新功能，支持自动检查和下载更新

### 🐛 修复问题

- **构建修复**: 发布流程修复，尝试解决打包问题

## [v0.2.0-alpha.4](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.4)(2025-06-13)

### 🚀 多平台多架构支持

- **Windows**: 支持 x64 和 arm64 架构
- **macOS**: 支持 x64 和 arm64 架构
- **Linux**: 支持 x64 架构

## [v0.2.0-alpha.3](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.3)(2025-06-12)

### 🐛 修复问题

- **依赖优化**: 移除 cheerio 依赖以解决 Electron 打包问题，使用原生正则表达式替代 HTML 解析 #50
- **字典解析**: 重构 parseEudicHtml() 为 parseEudicHtmlWithRegex()，支持多种 HTML 格式解析
- **运行时兼容**: 提升 Electron 运行时兼容性，减少打包体积

### ⚙️ 自动化改进

- **发布流程**: 新增自动化发布和版本检查功能，包括 release:auto 和 release:check 命令
- **Git Hook**: 添加 Git pre-push hook，在推送前自动检查版本状态
- **版本管理**: 新增版本管理和发布指南文档，详细说明版本管理流程
- **发布检查**: 实现发布前检查脚本，验证版本号、Git 状态和基本测试

### 🛠️ 构建优化

- **构建目标**: 移除 Linux 构建目标中的 snap 选项，简化构建配置
- **自动化脚本**: 实现自动化发布脚本，支持用户选择版本类型和发布渠道

## [v0.2.0-alpha.2](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.2)(2025-06-12)

### 🎯 字幕模式增强

- **字幕模式覆盖层**: 新增字幕模式覆盖层组件，支持实时显示当前字幕模式状态
- **快捷键切换**: 完善字幕模式快捷键功能，提供即时的视觉反馈
- **模式监控**: 新增字幕模式监控钩子，自动跟踪字幕模式变化
- **测试覆盖**: 增加字幕覆盖层组件的单元测试，提升代码质量

### 🛠️ 构建和配置优化

- **依赖管理**: 更新核心依赖版本，包括 electron、antd、cheerio 等
- **版本约束**: 在 package.json 中新增 overrides 配置，确保依赖版本一致性
- **构建简化**: 简化 CI/CD 流程，移除不必要的测试和检查步骤
- **多架构支持**: 优化 electron-builder 配置，支持 x64 和 arm64 多架构打包

### 🔧 技术改进

- **类型配置**: 优化 tsconfig.node.json 配置，简化包含路径
- **代码质量**: 修复依赖版本不一致问题，提升项目稳定性
- **构建缓存**: 优化构建缓存机制，提高构建效率

## [v0.2.0-alpha.1](https://github.com/mkdir700/echolab/tree/v0.2.0-alpha.1)(2025-06-11)

### 🎨 全新主题系统

- **统一设计**: 全面重构UI组件，采用统一的主题系统管理样式
- **一致体验**: 所有组件移除CSS Modules，使用标准化设计令牌（spacing、font-weights、border-radius等）
- **主题切换**: 完善的明暗主题支持，提供更加流畅的主题切换体验
- **响应式布局**: 优化组件响应式设计，提升不同屏幕尺寸下的用户体验

### 🖥️ 全屏模式增强

- **沉浸式体验**: 全新的沉浸式全屏播放体验
- **智能控制**: 全屏模式下的专用控制界面，支持进度条、音量控制等功能
- **快捷键优化**: 增强全屏模式下的快捷键支持
- **自适应样式**: 全屏模式下自动切换深色主题，提供最佳视觉效果

### 🎯 字幕功能优化

- **智能分段**: 新增智能字幕分段功能，自动优化字幕显示效果
- **文本选择**: 支持字幕文本选择和快捷复制功能
- **右键菜单**: 新增字幕右键菜单，提供更多操作选项
- **布局锁定**: 字幕位置锁定功能，避免意外拖拽
- **空状态优化**: 改进字幕空状态显示，支持拖拽导入字幕文件

### 🎮 播放控制增强

- **播放速度**: 新增播放速度覆盖层显示，实时反馈速度变化
- **音量控制**: 优化音量控制组件，提供更精确的音量调节
- **进度管理**: 改进播放进度管理，更好的进度保存和恢复
- **视频兼容性**: 新增视频兼容性检测和转码功能

### 🔧 技术架构改进

- **状态管理**: 引入Zustand状态管理，提升性能和维护性
- **组件解耦**: 大规模重构VideoPlayer和SubtitleV3模块，提高代码可维护性
- **样式系统**: 移除CSS Modules依赖，统一使用主题系统管理样式
- **性能优化**: 优化渲染性能，减少不必要的重渲染

### 📁 文件管理优化

- **最近播放**: 优化最近观看记录的加载状态显示
- **视频管理**: 新增视频文件管理组件和确认模态框
- **数据目录**: 新增数据目录管理功能
- **外部链接**: 支持外部链接打开功能

### 📚 文档和测试

- **完整文档**: 新增EchoLab完整文档和用户指南
- **GitHub Pages**: 设置GitHub Pages部署，提供在线文档访问
- **E2E测试**: 新增端到端测试用例，提升代码质量
- **开发指南**: 完善开发者文档和贡献指南

## [v0.1.0-beta.1](https://github.com/mkdir700/echolab/tree/v0.1.0-beta.1)(2025-06-04)

### 🎯 逐句精听系统

- **一键跳转**: 快速跳转到上一句/下一句字幕
- **自动暂停**: 每句结束后自动暂停，便于消化理解
- **单句循环**: 重复播放当前句子，强化练习效果
- **精确同步**: 字幕与视频完美同步显示

### 📽️ 专业播放控制

- **变速播放**: 支持 0.25x - 2.0x 多档速度调节
- **精确跳转**: 10秒前进/后退功能
- **音量控制**: 快捷键调节音量

### 📚 智能字幕系统

- **多格式支持**: 兼容 SRT、VTT、ASS/SSA、JSON 格式
- **自动检测**: 智能识别同名字幕文件
- **双语显示**: 支持原文、译文、双语三种模式
- **自由定位**: 字幕位置可拖拽调整

### 🗂️ 学习管理

- **播放记录**: 自动保存观看进度
- **文件管理**: 智能的最近播放列表
- **进度恢复**: 自动恢复上次播放位置

### 🎮 快捷键支持

| 功能       | 快捷键   | 说明              |
| ---------- | -------- | ----------------- |
| 播放/暂停  | `空格键` | 切换播放状态      |
| 上一句字幕 | `H`      | 跳转到上一句      |
| 下一句字幕 | `L`      | 跳转到下一句      |
| 单句循环   | `R`      | 开启/关闭循环     |
| 自动暂停   | `P`      | 开启/关闭自动暂停 |
| 音量调节   | `↑/↓`    | 调大/调小音量     |
| 快速跳转   | `←/→`    | 后退/前进10秒     |

### 📁 支持格式

- **常见格式**: MP4, AVI, MKV, MOV, WMV, FLV
- **高清支持**: 4K/1080P 高清视频
- **编码兼容**: 支持主流视频编码格式

### 字幕格式

- **SRT**: 最常用的字幕格式
- **VTT**: Web 标准字幕格式
- **ASS/SSA**: 高级样式字幕格式
- **JSON**: 自定义 JSON 字幕格式
