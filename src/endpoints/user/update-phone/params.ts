
import { HttpError } from '@celeri/http-error';
import { MiddlewareInput } from '@celeri/http-server';
import { schemaValidator } from '../../../utils/validate-schema';
import { PhoneField } from '@viva-eng/payload-validator';

export interface Req {
	body?: Body;
}

export interface Body {
	phone: string;
}

const validate = schemaValidator<Body>({
	phone: new PhoneField({ required: true })
});

export const validateBody = ({ req, res }: MiddlewareInput<void, Req>) => {
	if (! req.body) {
		throw new HttpError(400, 'Request payload is required', {
			expected: {
				phone: 'string'
			}
		});
	}

	const errors = validate(req.body);

	// If there were validation failures, return an error to the client
	if (errors) {
		throw new HttpError(422, 'Invalid request body contents', { errors });
	}
};
