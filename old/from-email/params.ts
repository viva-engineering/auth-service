
import { HttpError } from '@celeri/http-error';
import { MiddlewareInput } from '@celeri/http-server';
import { schemaValidator } from '../../../../utils/validate-schema';
import { StringField, EmailField } from '@viva-eng/payload-validator';

export interface Req {
	body?: Body;
}

export interface Body {
	requestId: string;
	verificationKey: string;
}

const validate = schemaValidator<Body>({
	requestId: new StringField({ required: true }),
	verificationKey: new StringField({ required: true })
});

/**
 * Validates a request payload for the `POST /session/from-email` endpoint
 */
export const validateBody = ({ req, res }: MiddlewareInput<void, Req>) => {
	if (! req.body) {
		throw new HttpError(400, 'Request payload is required', {
			expected: {
				requestId: 'string',
				verificationKey: 'string'
			}
		});
	}

	const errors = validate(req.body);

	// If there were validation failures, return an error to the client
	if (errors) {
		throw new HttpError(422, 'Invalid request body contents', { errors });
	}
};
