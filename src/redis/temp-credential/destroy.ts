
import { tempCredentialPool } from './pool';

export const destroyTempCredential = async (requestId: string) => {
	await tempCredentialPool.del([ requestId ]);
};
