
import { logger } from '../logger';
import { config } from '../config';
import { hash as argonHash, verify as argonVerify } from 'argon2';

Object.freeze(config.hashing);

/**
 * Hashes the given password and resolves with the digest
 *
 * @param password The password value to be hashed
 */
export const hash = (password: string) : Promise<string> => {
	return argonHash(password, config.hashing);
};

/**
 * Verifies that the given password matches the given digest
 *
 * @param digest The digest to compare against
 * @param password The password to test
 */
export const verify = (digest: string, password: string) : Promise<boolean> => {
	return argonVerify(digest, password);
};
