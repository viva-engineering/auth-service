
import { Field, StringField } from '@viva-eng/payload-validator';

type Schema<K extends string|number|symbol> = {
	[T in K]: Field<any>;
};

type SchemaValidationErrors<K extends string|number|symbol> = {
	[T in K]?: string[];
};

export const schemaValidator = <B>(schema: Schema<keyof B>) => {
	const keys = Object.keys(schema) as (keyof B)[];

	return (body: B) : SchemaValidationErrors<keyof B> | void => {
		let hasErrors = false;
		const errors: SchemaValidationErrors<keyof B> = { };

		keys.forEach((key) => {
			const value = body[key];
			const validator = schema[key];
			const keyErrors: string[] = validator.validate(value);

			if (keyErrors.length) {
				hasErrors = true;
				errors[key] = keyErrors;
			}
		});

		if (hasErrors) {
			return errors;
		}
	};
};

export const userCodeField = (required: boolean = false) => {
	return new StringField({ minLength: 40, maxLength: 40, required });
};
