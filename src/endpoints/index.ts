
const endpoints: string[] = [
	'./healthcheck/endpoint',
	'./registration/create/endpoint',
	'./session/create/from-email/endpoint',
	'./session/create/from-password/endpoint',
	'./session/create/from-session/endpoint',
	'./session/introspect/endpoint',
	'./credential/password/create/endpoint'
];

export const loadEndpoints = () => {
	endpoints.forEach((file) => require(file));
};
