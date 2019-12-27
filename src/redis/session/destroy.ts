
import { Session } from './types';
import { sessionPool } from './pool';

export const destroySession = async (token: string) => {
	await sessionPool.del([ token ]);
};
