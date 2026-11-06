param(
  [Parameter(Mandatory = $true)]
  [string]$Root
)
$Root = $Root.TrimEnd('\')
$target = Join-Path $Root 'Open To-Dey.bat'
$shell = New-Object -ComObject WScript.Shell
$folders = @(
  [Environment]::GetFolderPath('Desktop'),
  (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs')
)
foreach ($folder in $folders) {
  $link = $shell.CreateShortcut((Join-Path $folder 'To-Dey.lnk'))
  $link.TargetPath = $target
  $link.WorkingDirectory = $Root
  $link.WindowStyle = 7
  $link.Description = 'Open To-Dey'
  $link.Save()
}
Write-Output "Shortcuts saved."
