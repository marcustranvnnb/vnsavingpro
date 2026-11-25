$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$ArtifactDir = 'C:\Users\quang\.gemini\antigravity\brain\2764aac2-e404-4cef-89fa-8d1dd3c7a4f9'
$OutRoot = Join-Path $PSScriptRoot '..\public\assets\garden'
$OutRoot = [System.IO.Path]::GetFullPath($OutRoot)

foreach ($sub in @('', 'trees', 'stages', 'houses', 'mascot', 'props')) {
  $dir = if ($sub) { Join-Path $OutRoot $sub } else { $OutRoot }
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

function Save-BackgroundJpg([string]$srcFile, [string]$destFile, [int]$maxW = 1440) {
  $bmp = [System.Drawing.Bitmap]::new($srcFile)
  try {
    $ratio = [Math]::Min(1.0, $maxW / [double]$bmp.Width)
    $nw = [int][Math]::Round($bmp.Width * $ratio)
    $nh = [int][Math]::Round($bmp.Height * $ratio)
    $dst = [System.Drawing.Bitmap]::new($nw, $nh, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($bmp, 0, 0, $nw, $nh)
    $g.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
    $encParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $encParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 88L)
    $dst.Save($destFile, $codec, $encParams)
    $dst.Dispose()
  } finally {
    $bmp.Dispose()
  }
}

function Remove-WhiteEdgeBackgroundAndSave(
  [System.Drawing.Bitmap]$src,
  [System.Drawing.Rectangle]$cropRect,
  [string]$destPng,
  [int]$maxDim = 256,
  [int]$whiteThresh = 232
) {
  $w = $cropRect.Width
  $h = $cropRect.Height
  $cell = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($cell)
  $g.DrawImage($src, [System.Drawing.Rectangle]::new(0, 0, $w, $h), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $data = $cell.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $len = $stride * $h
  $buf = [byte[]]::new($len)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $len)

  $total = $w * $h
  $visited = [bool[]]::new($total)
  $isBg = [bool[]]::new($total)
  $queue = [System.Collections.Generic.Queue[int]]::new()

  $checkWhite = {
    param([int]$px, [int]$py)
    $idx = $py * $stride + $px * 4
    $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
    $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
    $minC = [Math]::Min($r, [Math]::Min($gr, $b))
    return ($minC -ge $whiteThresh -and ($maxC - $minC) -le 22)
  }

  for ($x = 0; $x -lt $w; $x++) {
    foreach ($y in @(0, ($h - 1))) {
      $p = $y * $w + $x
      if (-not $visited[$p]) {
        $visited[$p] = $true
        $idx = $y * $stride + $x * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b))
        $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) {
          $isBg[$p] = $true
          $queue.Enqueue($p)
        }
      }
    }
  }
  for ($y = 0; $y -lt $h; $y++) {
    foreach ($x in @(0, ($w - 1))) {
      $p = $y * $w + $x
      if (-not $visited[$p]) {
        $visited[$p] = $true
        $idx = $y * $stride + $x * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b))
        $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) {
          $isBg[$p] = $true
          $queue.Enqueue($p)
        }
      }
    }
  }

  while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cx = $curr % $w
    $cy = [int](($curr - $cx) / $w)

    if ($cx -gt 0) {
      $np = $curr - 1
      if (-not $visited[$np]) {
        $visited[$np] = $true
        $idx = $cy * $stride + ($cx - 1) * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b)); $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) { $isBg[$np] = $true; $queue.Enqueue($np) }
      }
    }
    if ($cx -lt ($w - 1)) {
      $np = $curr + 1
      if (-not $visited[$np]) {
        $visited[$np] = $true
        $idx = $cy * $stride + ($cx + 1) * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b)); $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) { $isBg[$np] = $true; $queue.Enqueue($np) }
      }
    }
    if ($cy -gt 0) {
      $np = $curr - $w
      if (-not $visited[$np]) {
        $visited[$np] = $true
        $idx = ($cy - 1) * $stride + $cx * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b)); $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) { $isBg[$np] = $true; $queue.Enqueue($np) }
      }
    }
    if ($cy -lt ($h - 1)) {
      $np = $curr + $w
      if (-not $visited[$np]) {
        $visited[$np] = $true
        $idx = ($cy + 1) * $stride + $cx * 4
        $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($gr, $b)); $maxC = [Math]::Max($r, [Math]::Max($gr, $b))
        if ($minC -ge $whiteThresh -and ($maxC - $minC) -le 24) { $isBg[$np] = $true; $queue.Enqueue($np) }
      }
    }
  }

  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $p = $y * $w + $x
      $idx = $y * $stride + $x * 4
      if ($isBg[$p]) {
        $buf[$idx + 3] = 0
      } else {
        # Feather subtle white halo adjacent to erased background (including faint floor shadow edge)
        $hasBgNeighbor = (
          ($x -gt 0 -and $isBg[$p - 1]) -or
          ($x -lt ($w - 1) -and $isBg[$p + 1]) -or
          ($y -gt 0 -and $isBg[$p - $w]) -or
          ($y -lt ($h - 1) -and $isBg[$p + $w])
        )
        if ($hasBgNeighbor) {
          $b = $buf[$idx]; $gr = $buf[$idx + 1]; $r = $buf[$idx + 2]
          $lum = ($r + $gr + $b) / 3.0
          if ($lum -gt 205) {
            $alpha = [int][Math]::Max(30, [Math]::Min(255, (255 - $lum) * 4.5))
            $buf[$idx + 3] = [byte]$alpha
          }
        }
        if ($buf[$idx + 3] -gt 20) {
          if ($x -lt $minX) { $minX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $len)
  $cell.UnlockBits($data)

  if ($maxX -le $minX -or $maxY -le $minY) {
    $minX = 0; $minY = 0; $maxX = $w - 1; $maxY = $h - 1
  }

  $pad = 4
  $trimX = [Math]::Max(0, $minX - $pad)
  $trimY = [Math]::Max(0, $minY - $pad)
  $trimW = [Math]::Min($w - $trimX, ($maxX - $minX + 1) + $pad * 2)
  $trimH = [Math]::Min($h - $trimY, ($maxY - $minY + 1) + $pad * 2)

  $scale = [Math]::Min(1.0, $maxDim / [double][Math]::Max($trimW, $trimH))
  $outW = [Math]::Max(1, [int][Math]::Round($trimW * $scale))
  $outH = [Math]::Max(1, [int][Math]::Round($trimH * $scale))

  $finalBmp = [System.Drawing.Bitmap]::new($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $fg = [System.Drawing.Graphics]::FromImage($finalBmp)
  $fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $fg.DrawImage($cell, [System.Drawing.Rectangle]::new(0, 0, $outW, $outH), [System.Drawing.Rectangle]::new($trimX, $trimY, $trimW, $trimH), [System.Drawing.GraphicsUnit]::Pixel)
  $fg.Dispose()
  $finalBmp.Save($destPng, [System.Drawing.Imaging.ImageFormat]::Png)
  $finalBmp.Dispose()
  $cell.Dispose()
}

function Slice-Grid([string]$srcFile, [int]$cols, [int]$rows, [string[]]$outPaths, [int]$maxDim = 256, [int]$whiteThresh = 228) {
  $bmp = [System.Drawing.Bitmap]::new($srcFile)
  try {
    $cw = [double]$bmp.Width / $cols
    $ch = [double]$bmp.Height / $rows
    for ($r = 0; $r -lt $rows; $r++) {
      for ($c = 0; $c -lt $cols; $c++) {
        $i = $r * $cols + $c
        if ($i -ge $outPaths.Length -or [string]::IsNullOrWhiteSpace($outPaths[$i])) { continue }
        $x = [int][Math]::Floor($c * $cw)
        $y = [int][Math]::Floor($r * $ch)
        $w = [int][Math]::Floor(($c + 1) * $cw) - $x
        $h = [int][Math]::Floor(($r + 1) * $ch) - $y
        $rect = [System.Drawing.Rectangle]::new($x, $y, $w, $h)
        $dest = Join-Path $OutRoot $outPaths[$i]
        Remove-WhiteEdgeBackgroundAndSave $bmp $rect $dest $maxDim $whiteThresh
      }
    }
  } finally {
    $bmp.Dispose()
  }
}

Write-Host '1/7 Optimizing sky-island-map.jpg...'
Save-BackgroundJpg (Join-Path $ArtifactDir 'asset_1_sky_island_map_1795581717755.jpg') (Join-Path $OutRoot 'sky-island-map.jpg') 1440

Write-Host '2/7 Slicing 9 core Vietnam trees...'
Slice-Grid (Join-Path $ArtifactDir 'asset_2_vietnam_trees_pack_1795581720113.jpg') 3 3 @(
  'trees/sen_dong_thap.png',
  'trees/quat_tu_lien.png',
  'trees/thanh_long.png',
  'trees/dao_nhat_tan.png',
  'trees/dua_xiem_ben_tre.png',
  'trees/xoai_hoa_loc.png',
  'trees/sau_rieng_ri6.png',
  'trees/tre_nga_thanh_giong.png',
  'trees/mai_tram_huong.png'
) 260 226

Write-Host '3/7 Slicing remaining 5 Vietnam trees + seed pot...'
Slice-Grid (Join-Path $ArtifactDir 'asset_2b_vietnam_trees_remaining5_1795581901067.jpg') 3 2 @(
  'trees/ca_phe.png',
  'trees/vai_thieu_luc_ngan.png',
  'trees/vusua_lo_ren.png',
  'trees/buoi_da_xanh.png',
  'trees/che_shan_tuyet.png',
  'props/seed_pot.png'
) 260 226

Write-Host '4/7 Slicing Miu Vang 3D mascot (4 poses)...'
Slice-Grid (Join-Path $ArtifactDir 'asset_3_miu_vang_mascot_pack_1795581723090.jpg') 2 2 @(
  'mascot/miu_wave.png',
  'mascot/miu_gardener.png',
  'mascot/miu_celebrate.png',
  'mascot/miu_scholar.png'
) 260 228

Write-Host '5/7 Slicing Mystery Fruits & Island props...'
Slice-Grid (Join-Path $ArtifactDir 'asset_4_mystery_fruits_props_pack_1795581727415.jpg') 3 3 @(
  'props/fruit_ruby.png',
  'props/fruit_mango.png',
  'props/fruit_jade.png',
  'props/watering_can.png',
  'props/seed_gold.png',
  'props/signpost.png',
  'props/pavilion.png',
  'props/fountain.png',
  'props/chest.png'
) 240 228

Write-Host '6/7 Slicing Growth Stages 1, 2, 4, 6 across 4 tree families...'
Slice-Grid (Join-Path $ArtifactDir 'asset_5_tree_growth_evolution_1795581904318.jpg') 4 4 @(
  'stages/fruit_s1.png', 'stages/fruit_s2.png', 'stages/fruit_s4.png', 'stages/fruit_s6.png',
  'stages/bonsai_s1.png', 'stages/bonsai_s2.png', 'stages/bonsai_s4.png', 'stages/bonsai_s6.png',
  'stages/tropical_s1.png', 'stages/tropical_s2.png', 'stages/tropical_s4.png', 'stages/tropical_s6.png',
  'stages/lotus_s1.png', 'stages/lotus_s2.png', 'stages/lotus_s4.png', 'stages/lotus_s6.png'
) 220 226

Write-Host '7/7 Slicing Growth Stages 3, 5, 7 across 4 tree families...'
Slice-Grid (Join-Path $ArtifactDir 'asset_5b_growth_stages_3_5_7_1795582070206.jpg') 3 4 @(
  'stages/fruit_s3.png', 'stages/fruit_s5.png', 'stages/fruit_s7.png',
  'stages/bonsai_s3.png', 'stages/bonsai_s5.png', 'stages/bonsai_s7.png',
  'stages/tropical_s3.png', 'stages/tropical_s5.png', 'stages/tropical_s7.png',
  'stages/lotus_s3.png', 'stages/lotus_s5.png', 'stages/lotus_s7.png'
) 220 226

Write-Host '8/7 Slicing Evolving Houses Lv.1..5 & Locked Expansion Plot...'
Slice-Grid (Join-Path $ArtifactDir 'asset_6_evolving_houses_pack_1795582348552.jpg') 3 2 @(
  'houses/house_lv1.png',
  'houses/house_lv2.png',
  'houses/house_lv3.png',
  'houses/house_lv4.png',
  'houses/house_lv5.png',
  'houses/plot_locked.png'
) 280 226

$count = (Get-ChildItem $OutRoot -Recurse -File).Count
Write-Host "Done! Generated $count optimized asset files under $OutRoot"
