/**
 * Chrome iOS Autofill adds __gCrUniqueID to forms/fields before hydration.
 * Preserve those browser-owned IDs; tolerate attributes on these auth controls
 * only. Do not spread onto page wrappers or the global Input primitive.
 * https://chromium.googlesource.com/chromium/src/+/main/components/autofill/ios/form_util/resources/fill_constants.ts
 * React's exception is one level deep; descendants remain checked.
 */
export const autofillHydrationProps = {
  suppressHydrationWarning: true,
} as const;
