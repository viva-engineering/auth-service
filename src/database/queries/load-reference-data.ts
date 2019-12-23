
import { format } from 'mysql2';
import { SelectQuery } from '@viva-eng/database';

export interface ReferenceTableRecord<T extends string> {
	id: number;
	description: T;
}

export type LoadReferenceDataQuery<T extends string> = SelectQuery<void, ReferenceTableRecord<T>>;

/**
 * Creates a new `SelectQuery` object that loads a full reference data table
 * and returns its contents.
 *
 *     select id, description from ??
 *
 * @param tableName The name of the reference data table to be loaded
 */
export const createLoadReferenceDataQuery = <T extends string>(tableName: string) : LoadReferenceDataQuery<T> =>
	new SelectQuery({
		description: `select id, description from ${tableName}`,
		maxRetries: 5,
		isRetryable() {
			return true;
		},
		compile() {
			return format('select id, description from ??', [ tableName ]);
		}
	});
