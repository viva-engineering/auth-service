
const { randomBytes } = require('crypto');

export const charsets = {
	alphaLower: 'abcdefghijklmnopqrstuvwxyz',
	alphaUpper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	numeric: '1234567890',
	symbol: '!@#$%^&*()/?;:|[]-=_+`~.,><'
};

export const randInt = (min: number, max: number) => {
	return (Math.random() * (max - min) + min) | 0;
};

export const randStringCrypto = (length: number, charset: string) => {
	return new Promise((resolve, reject) => {
		const chars = new Array(length);

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

export const randStringSync = (length: number, charset: string) => {
	const chars = new Array(length);

	for (let i = 0; i < length; i++) {
		const rand = randInt(0, charset.length - 1);

		chars[i] = charset[rand];
	}

	return chars.join('');
};
