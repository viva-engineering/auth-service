
import { HttpError } from '@celeri/http-error';
import { MiddlewareInput } from '@celeri/http-server';
import { schemaValidator } from '../../../../utils/validate-schema';
import { StringField, BooleanField } from '@viva-eng/payload-validator';

export interface Req {
	body?: Body;
}

export interface Body {
	username: string;
	password: string;
	elevated?: boolean;
}

const validate = schemaValidator<Body>({
	username: new StringField({ required: true }),
	password: new StringField({ required: true }),
	elevated: new BooleanField({ })
});

/**
 * Validates a request payload for the `POST /session/from-password` endpoint
 */
export const validateBody = ({ req, res }: MiddlewareInput<void, Req>) => {
	if (! req.body) {
		throw new HttpError(400, 'Request payload is required', {
			expected: {
				username: 'string',
				password: 'string'
			}
		});
	}

	const errors = validate(req.body);

	// If there were validation failures, return an error to the client
	if (errors) {
		throw new HttpError(422, 'Invalid request body contents', { errors });
	}
};
