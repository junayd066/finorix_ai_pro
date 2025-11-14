/**
 * Generate a device fingerprint based on browser characteristics
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || "unknown",
    navigator.platform,
  ];

  const fingerprint = components.join("|");
  
  // Hash the fingerprint using SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
};

/**
 * Get stored device fingerprint from localStorage
 */
export const getStoredFingerprint = (): string | null => {
  return localStorage.getItem("deviceFingerprint");
};

/**
 * Store device fingerprint in localStorage
 */
export const storeFingerprint = (fingerprint: string): void => {
  localStorage.setItem("deviceFingerprint", fingerprint);
};

/**
 * Verify if current device matches stored fingerprint
 */
export const verifyDevice = async (): Promise<boolean> => {
  const storedFingerprint = getStoredFingerprint();
  if (!storedFingerprint) return false;
  
  const currentFingerprint = await generateDeviceFingerprint();
  return storedFingerprint === currentFingerprint;
};
