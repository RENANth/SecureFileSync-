import _sodium from 'libsodium-wrappers';

// Initialize sodium
let sodium: typeof _sodium;
const initSodium = async (): Promise<void> => {
  if (!sodium) {
    await _sodium.ready;
    sodium = _sodium;
  }
};

/**
 * Generate a random encryption key
 */
export const generateEncryptionKey = async (): Promise<string> => {
  await initSodium();
  const key = sodium.crypto_secretbox_keygen();
  return sodium.to_base64(key);
};

/**
 * Encrypt a file using libsodium's secretbox
 */
export const encryptFile = async (file: File): Promise<{ encryptedFile: Uint8Array; encryptionKey: string }> => {
  await initSodium();
  
  // Read the file
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);
  
  // Generate a random key
  const key = sodium.crypto_secretbox_keygen();
  
  // Generate a random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  
  // Encrypt the file
  const encryptedContent = sodium.crypto_secretbox_easy(fileBytes, nonce, key);
  
  // Combine nonce and encrypted content (nonce needs to be stored with the encrypted data)
  const encryptedFile = new Uint8Array(nonce.length + encryptedContent.length);
  encryptedFile.set(nonce);
  encryptedFile.set(encryptedContent, nonce.length);
  
  // Return the encrypted file and the base64-encoded key
  return {
    encryptedFile,
    encryptionKey: sodium.to_base64(key)
  };
};

/**
 * Decrypt a file using libsodium's secretbox
 */
export const decryptFile = async (encryptedData: Uint8Array, keyBase64: string): Promise<Uint8Array> => {
  await initSodium();
  
  // Convert the base64 key back to Uint8Array
  const key = sodium.from_base64(keyBase64);
  
  // Extract the nonce from the beginning of the encrypted data
  const nonce = encryptedData.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  
  // Extract the encrypted content (everything after the nonce)
  const encryptedContent = encryptedData.slice(sodium.crypto_secretbox_NONCEBYTES);
  
  // Decrypt the file
  const decryptedContent = sodium.crypto_secretbox_open_easy(encryptedContent, nonce, key);
  
  return decryptedContent;
};

/**
 * Generate a password hash for secure storage
 */
export const hashPassword = async (password: string): Promise<string> => {
  await initSodium();
  return sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
  );
};

/**
 * Verify a password against a stored hash
 */
export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  await initSodium();
  return sodium.crypto_pwhash_str_verify(hash, password);
};
