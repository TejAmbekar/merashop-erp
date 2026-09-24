$ErrorActionPreference = "Stop"

$serviceName = "postgresql-x64-17"
$dataDirectory = "C:\Program Files\PostgreSQL\17\data"
$hbaPath = Join-Path $dataDirectory "pg_hba.conf"
$backupPath = Join-Path $dataDirectory "pg_hba.conf.mera-shop-backup"
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$databaseName = "mera_shop"
$databaseUser = "mera"
$databasePassword = "mera_password"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please open PowerShell with Run as administrator, then run this script again."
}

if (-not (Test-Path $hbaPath)) { throw "PostgreSQL configuration file was not found: $hbaPath" }
if (-not (Test-Path $psqlPath)) { throw "PostgreSQL client was not found: $psqlPath" }

$originalHba = Get-Content $hbaPath -Raw
$temporaryHba = $originalHba -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)\S+', '$1trust' -replace '(host\s+all\s+all\s+::1/128\s+)\S+', '$1trust'
$restored = $false

try {
  Copy-Item $hbaPath $backupPath -Force
  [System.IO.File]::WriteAllText($hbaPath, $temporaryHba, $utf8NoBom)
  Restart-Service $serviceName

  & $psqlPath -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$databaseUser') THEN CREATE ROLE $databaseUser LOGIN PASSWORD '$databasePassword'; ELSE ALTER ROLE $databaseUser WITH LOGIN PASSWORD '$databasePassword'; END IF; END `$`$;"

  $databaseExists = ((& $psqlPath -h 127.0.0.1 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$databaseName'" | Out-String).Trim())
  if ($databaseExists -ne "1") {
    & $psqlPath -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $databaseName OWNER $databaseUser;"
  } else {
    & $psqlPath -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE $databaseName OWNER TO $databaseUser;"
  }
}
finally {
  [System.IO.File]::WriteAllText($hbaPath, $originalHba, $utf8NoBom)
  Restart-Service $serviceName
  $restored = $true
}

$env:DATABASE_URL = "postgresql://${databaseUser}:${databasePassword}@127.0.0.1:5432/${databaseName}"
& $psqlPath "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT 1;" | Out-Null
Write-Host "Database is ready. PostgreSQL authentication has been restored securely." -ForegroundColor Green
Write-Host "Now run: npm run server" -ForegroundColor Cyan