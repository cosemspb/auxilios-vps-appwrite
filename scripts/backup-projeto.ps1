<#
.SYNOPSIS
  Gera backup .zip do projeto excluindo dependencias e build artifacts.
.DESCRIPTION
  Cria um arquivo .zip em C:\_Apps com o nome:
    auxilios_sb_YYYY-MM-DD_HHmmss.zip
  Exclui: node_modules, .next, .git, .env.local, graphify-out/cache, .agents/
.PARAMETER OutputDir
  Diretorio de saida (padrao: C:\_Apps)
.PARAMETER SourceDir
  Diretorio do projeto (padrao: diretorio atual)
#>

param(
  [string]$OutputDir = "C:\_Apps",
  [string]$SourceDir = (Get-Location).Path
)

# Normalizar caminhos
$SourceDir = (Resolve-Path $SourceDir).Path

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$zipName = "auxilios_sb_$timestamp.zip"
$zipPath = Join-Path -Path $OutputDir -ChildPath $zipName

# Prefixos de caminho a excluir (sempre relativos ao SourceDir)
$excludePrefixes = @(
  "node_modules\",
  ".next\",
  ".git\",
  ".env.local",
  ".env",
  "graphify-out\cache\",
  ".agents\",
  "scripts\diagnose-corrections.ts"
)

Write-Host "Origem: $SourceDir" -ForegroundColor Cyan
Write-Host "Destino: $zipPath" -ForegroundColor Cyan

# Coletar todos os arquivos
Write-Host "Listando arquivos..." -ForegroundColor Yellow
$files = Get-ChildItem -Path $SourceDir -Recurse -File | Where-Object {
  $relPath = $_.FullName.Substring($SourceDir.Length + 1)
  $exclude = $false
  foreach ($prefix in $excludePrefixes) {
    if ($relPath -eq $prefix -or $relPath.StartsWith($prefix)) {
      $exclude = $true
      break
    }
  }
  -not $exclude
}

$totalSizeMB = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
$fileCount = $files.Count
Write-Host "$fileCount arquivos encontrados (~${totalSizeMB}MB)" -ForegroundColor Cyan

# Criar zip usando ZipArchive (mais controle que Compress-Archive)
Write-Host "Compactando..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
$zip = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

$i = 0
foreach ($file in $files) {
  $relPath = $file.FullName.Substring($SourceDir.Length + 1)
  $entry = $zip.CreateEntry($relPath, [System.IO.Compression.CompressionLevel]::Optimal)
  $entryStream = $entry.Open()
  $fileStream = [System.IO.File]::OpenRead($file.FullName)
  $fileStream.CopyTo($entryStream)
  $fileStream.Close()
  $entryStream.Close()

  $i++
  if ($i % 500 -eq 0) {
    Write-Host "  $i / $fileCount arquivos..."
  }
}

$zip.Dispose()
$zipStream.Close()
$sw.Stop()

$finalSizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host ""
Write-Host " Backup concluido!" -ForegroundColor Green
Write-Host " Arquivo: $zipPath" -ForegroundColor Green
Write-Host " Tamanho: ${finalSizeMB}MB" -ForegroundColor Green
Write-Host " Arquivos: $fileCount" -ForegroundColor Green
Write-Host " Duracao: $($sw.Elapsed.TotalSeconds.ToString('F1'))s" -ForegroundColor Green
