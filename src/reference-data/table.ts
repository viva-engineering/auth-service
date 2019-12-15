
import { format } from 'mysql2';
import { db } from '../database';
import { config } from '../config';
import { logger } from '../logger';
import { SelectQuery } from '@viva-eng/database';

export type ReferenceTableById<T extends string> = {
	[id: number]: T;
};

export type ReferenceTableByDescription<T extends string> = {
	[description in T]?: number;
}

interface ReferenceTableRecord<T extends string> {
	id: number;
	description: T;
}

export class ReferenceTable<T extends string> {
	public readonly loaded: Promise<void>;

	private _byId: ReferenceTableById<T>;
	private _byDescription: ReferenceTableByDescription<T>;

	private readonly getQuery: SelectQuery<void, ReferenceTableRecord<T>>;

	constructor(public readonly tableName: string) {
		this.getQuery = new SelectQuery({
			description: `select id, description from ${tableName}`,
			maxRetries: 5,
			isRetryable() {
				return true;
			},
			compile() {
				return format('select id, description from ??', [ tableName ]);
			}
		});

		this.loaded = new Promise((resolve, reject) => {
			this.refresh().then(resolve, reject);
		});
	}

	public get byId() {
		return this._byId;
	}

	public get byDescription() {
		return this._byDescription;
	}

	private refresh = async () => {
		logger.debug('Refreshing reference data table', { table: this.tableName });

		const result = await db.query(this.getQuery);

		this._byId = { };
		this._byDescription = { };

		for (let i = 0; i < result.results.length; i++) {
			const record = result.results[i];

			this._byId[record.id] = record.description;
			this._byDescription[record.description] = record.id;
		}

		logger.debug('Scheduling next reference data refresh', { table: this.tableName, delay: config.refTables.refreshInterval });

		setTimeout(this.refresh, config.refTables.refreshInterval);
	}
}
