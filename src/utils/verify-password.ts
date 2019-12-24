
import { db } from '../database';
import { verify } from './hasher';
import {  } from '@viva-eng/database';
import { PoolConnection } from 'mysql2';
import { getPasswordCredentials as getCredentialsByUserId } from '../database/queries/credential/get-password-by-user-id';
import { getPasswordCredentials as getCredentialsByUsername } from '../database/queries/credential/get-password-by-username';

export const verifyPasswordByUserId = async (connection: PoolConnection, userId: string, password: string) => {
	const credentials = await db.runQuery(connection, getCredentialsByUserId, { userId });

	if (! credentials.results.length) {
		return false;
	}

	const credential = credentials.results[0];
	const passwordIsValid = await verify(credential.cred_digest, password);

	if (! passwordIsValid) {
		return false;
	}

	return credential;
};

export const verifyPasswordByUsername = async (connection: PoolConnection, username: string, password: string) => {
	const credentials = await db.runQuery(connection, getCredentialsByUsername, { username });

	if (! credentials.results.length) {
		return false;
	}

	const credential = credentials.results[0];
	const passwordIsValid = await verify(credential.cred_digest, password);

	if (! passwordIsValid) {
		return false
	}

	return credential;
};
