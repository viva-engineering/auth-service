
export interface TempCredentialRecord {
	requestId: string;
	secretKeyDigest: string;
	userId: string;
	verifiesEmail?: string;
	verifiesPhone?: string;
}
