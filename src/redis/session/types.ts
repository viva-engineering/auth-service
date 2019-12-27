
import { UserRole } from '../../reference-data';

export interface StoredSession {
	token: string;
	user_id: string;
	is_elevated?: '0' | '1';
	application_id?: string;
	user_role: UserRole;
}

export interface Session {
	token: string;
	userId: string;
	isElevated: boolean;
	applicationId?: string;
	userRole: UserRole;
	ttl: number;
}
