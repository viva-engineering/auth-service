
import { config } from '../config';
import { UserFlow, HttpRequest } from '@viva-eng/perf-test';
import { randStringSync, charsets, randInt } from '../utils/rand';
import { sleep } from '../utils/sleep';

const chars = charsets.alphaLower + charsets.alphaUpper + charsets.numeric;

export class NewUserFlow extends UserFlow {
	public readonly name = 'New User';

	private username: string;
	private password: string;
	private authToken: string;

	protected readonly setup = () => {
		this.username = randStringSync(15, chars);
		this.password = randStringSync(15, chars);
	};

	protected async run() {
		const status = await this.createUser();

		if (status === 201) {
			await sleep(randInt(200, 2000));
			
			await this.login();

			if (this.authToken) {
				for (let i = 0; i < 3; i++) {
					await sleep(randInt(100, 500));
					await this.introspect();
				}
			}
		}
	}

	private async createUser() {
		const payload = JSON.stringify({
			username: this.username,
			password: this.password
		});

		const { statusCode } = await this.runRequest(HttpRequest, 'Create User', [ ], {
			host: config.host,
			port: config.port,
			ssl: config.ssl,
			method: 'POST',
			path: '/user',
			body: payload,
			headers: {
				'content-type': 'application/json'
			}
		});

		return statusCode;
	}

	private async login() {
		const payload = JSON.stringify({
			username: this.username,
			password: this.password
		});

		const req = await this.runRequest(HttpRequest, 'Login', [ ], {
			host: config.host,
			port: config.port,
			ssl: config.ssl,
			method: 'POST',
			path: '/session/from-password',
			body: payload,
			headers: {
				'content-type': 'application/json'
			}
		});

		if (req.statusCode === 201) {
			const { token } = JSON.parse(req.body);

			this.authToken = token;
		}
	}

	private async introspect() {
		await this.runRequest(HttpRequest, 'Introspect', [ ], {
			host: config.host,
			port: config.port,
			ssl: config.ssl,
			method: 'GET',
			path: '/session/introspect',
			headers: {
				'authorization': `Bearer ${this.authToken}`
			}
		});
	}
}
