@echo off
chcp 65001 >nul
rem ============================================================
rem  エージェントチームを起動する（不具合の究明・部をまたぐ判断のときだけ使う）
rem  使い方:
rem    scripts\team.bat bug   "症状の説明"
rem    scripts\team.bat cross "決めたいこと"
rem  ※ 普段の作業では使わないこと（トークンを多く使うため）
rem ============================================================
cd /d "%~dp0\.."
set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
set OTHER=..\VibeCodingYouTubeAnalysisApp
if /i "%~1"=="bug" (
  claude --add-dir "%OTHER%" "エージェントチームで不具合を究明してください。手順は /team-bug に従うこと。症状: %~2"
  goto :eof
)
if /i "%~1"=="cross" (
  claude --add-dir "%OTHER%" "エージェントチームで部をまたぐ判断をしてください。手順は /team-cross に従うこと。決めたいこと: %~2"
  goto :eof
)
echo 使い方: scripts\team.bat bug "症状"   または   scripts\team.bat cross "決めたいこと"
