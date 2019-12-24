
import { db } from '../../../../database';
import { PoolConnection } from 'mysql2';
import { TransactionType } from '@viva-eng/database';
import { createCredential } from '../../../../database/queries/credential/create-application-credential';
import { HttpError } from '@celeri/http-error';
import { logger } from '../../../../logger';
import { hash } from '../../../../utils/hasher';

export const createApplicationCredential = (userId: string, applicationId: string) => {
	// 
};
