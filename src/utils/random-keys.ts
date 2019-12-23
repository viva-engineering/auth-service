
import { randomBytes } from 'crypto';

const charsets = {
	alphaLower: 'abcdefghijklmnopqrstuvwxyz',
	alphaUpper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	numeric: '1234567890',
	symbol: '!@#$%^&*()/?;:|[]-=_+`~.,><'
};

const requestIdCharset = charsets.alphaUpper + charsets.numeric;
const userCodeCharset = charsets.alphaLower + charsets.alphaUpper + charsets.numeric;
const sessionKeyCharset = charsets.alphaLower + charsets.alphaUpper + charsets.numeric + charsets.symbol;
const applicationIdCharset = charsets.alphaLower + charsets.alphaUpper + charsets.numeric;
const verificationKeyCharset = charsets.alphaUpper + charsets.numeric;

/**
 * Generates a random ID used to uniquely identify a particular request in log out
 */
export const generateRequestId = () : Promise<string> => {
	return randomString(10, requestIdCharset);
};

/**
 * Generates a cryptographically strong random session token
 */
export const generateSessionKey = () : Promise<string> => {
	return randomString(128, sessionKeyCharset);
};

/**
 * Generates a random user code
 */
export const generateUserCode = () : Promise<string> => {
	return randomString(40, userCodeCharset);
};

/**
 * Generates a random application ID
 */
export const generateApplicationId = () : Promise<string> => {
	return randomString(20, applicationIdCharset);
};

/**
 * Generates a random application secret key
 */
export const generateApplicationSecretKey = () : Promise<string> => {
	return randomString(40, applicationIdCharset);
};

/**
 * Generates the verification request ID for MFA like email verification
 */
export const generateCredentialRequestId = () : Promise<string> => {
	return randomString(30, verificationKeyCharset);
};

/**
 * Generates a short verification key for MFA like email verification
 */
export const generateVerificationKey = () : Promise<string> => {
	return randomString(6, verificationKeyCharset);
};

/**
 * Generates a random string of the given length, taken from the given character set
 *
 * @param length The length in bytes of the output string
 * @param charset The set of valid characters to choose from
 */
export const randomString = (length: number, charset: string) : Promise<string> => {
	return new Promise((resolve, reject) => {
		const chars: string[] = new Array(length);

		randomBytes(length, (error, bytes) => {
			if (error) {
				return reject(error);
			}

			for (let i = 0; i < length; i++) {
				chars[i] = charset[bytes[i] % charset.length];
			}

			resolve(chars.join(''));
		});
	});
};