# Cashly auth branding

- `cashly-header-source.png`: hasil edit imagegen bawaan dari gambar tile Mochi
  terbaru yang dilampirkan pengguna. Diambil tile putih, Mochi sederhana dan
  bintang emas; latar studio lavender di luar tile dihapus.
- `cashly-header.webp`: versi 176 × 176 dengan alpha untuk header 44px (4×).
- `google-g.png`: aset logo resmi yang disajikan lokal, sumber
  https://developers.google.com/static/identity/images/g-logo.png ; panduan:
  https://developers.google.com/identity/branding-guidelines .
- Tombol Google pada prototype hanya membuka penjelasan; belum memanggil OAuth.

## Prompt edit header

Edit target: the user's most recently attached image, showing a smiling small
purple jelly Mochi on a soft white rounded-square app tile, with small gold
sparkles and an outer lavender studio background. Create the header logo asset
by extracting ONLY that existing white rounded-square tile and its purple mascot
and gold sparkles. Remove all the outer lavender studio backdrop and its ground
shadow; outside the rounded white tile must be genuinely transparent. Crop
closely around the entire white tile, leaving a small even transparent margin.
Preserve the tile's original white material, corner shape, the exact purple bean
mascot, face, tiny gold stars, colors, lighting and proportions. Keep its original
front-facing view. Do not replace with the crowned mascot, do not add a crown or
coins, no text, no border, no redesign, no checkerboard, no extra objects. The tile
should fill almost the whole square output so the small mascot remains readable
when rendered as a 40px website header logo. Produce a clean RGBA PNG with
antialiased alpha.
