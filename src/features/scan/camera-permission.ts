const approvalKey = "cashly-camera-intro-approved";
let approvedInMemory = false;

export function hasCameraApproval() {
  try {
    return localStorage.getItem(approvalKey) === "1";
  } catch {
    return approvedInMemory;
  }
}

export function rememberCameraApproval(approved: boolean) {
  approvedInMemory = approved;
  try {
    if (approved) localStorage.setItem(approvalKey, "1");
    else localStorage.removeItem(approvalKey);
  } catch {
    // The preference is optional; browser permission remains authoritative.
  }
}

export async function canSkipCameraIntro() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    return false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const state = await Promise.race([
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((permission) => permission.state),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), 1000);
      }),
    ]);
    if (state === "denied") {
      rememberCameraApproval(false);
      return false;
    }
    return state === "granted" || hasCameraApproval();
  } catch {
    return hasCameraApproval();
  } finally {
    clearTimeout(timer);
  }
}
