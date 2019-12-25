
import { ReferenceTable } from './table';

export enum UserRole {
	User = 'user',
	System = 'system',
	Admin = 'admin',
	SuperModerator = 'super_moderator',
	Moderator = 'moderator',
	Localization = 'localization'
}

export enum VisibilityScheme {
	Private = 'private',
	Public = 'public',
	VisibleToFollowers = 'visible_to_followers'
}

export enum CredentialType {
	Password = 'password',
	TempCredential = 'temp_credential',
	Application = 'application'
}

export const userRoles = new ReferenceTable<UserRole>('user_role');
export const visibilitySchemes = new ReferenceTable<VisibilityScheme>('visibility_scheme');
export const credentialTypes = new ReferenceTable<CredentialType>('credential_type');
