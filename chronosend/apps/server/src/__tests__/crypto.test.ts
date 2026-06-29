import { encrypt, decrypt } from '../services/crypto';

describe('Crypto Service', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const plaintext = 'Hello, ChronoSend!';
    const encrypted = encrypt(plaintext);

    expect(encrypted.encrypted).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.encrypted).not.toBe(plaintext);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same plaintext', () => {
    const plaintext = 'Same message';
    const result1 = encrypt(plaintext);
    const result2 = encrypt(plaintext);

    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);
  });

  it('should handle empty strings', () => {
    const plaintext = '';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle special characters and unicode', () => {
    const plaintext = 'Special: !@#$%^&*()_+ 中文 Español 日本語';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw on tampered ciphertext', () => {
    const plaintext = 'Test message';
    const encrypted = encrypt(plaintext);

    // Tamper with the encrypted data
    const tampered = { ...encrypted, encrypted: '00' + encrypted.encrypted.slice(2) };

    expect(() => decrypt(tampered)).toThrow();
  });

  it('should throw on tampered auth tag', () => {
    const plaintext = 'Test message';
    const encrypted = encrypt(plaintext);

    // Tamper with the auth tag
    const tampered = { ...encrypted, tag: encrypted.tag.replace(/^.{4}/, 'ffff') };

    expect(() => decrypt(tampered)).toThrow();
  });
});
