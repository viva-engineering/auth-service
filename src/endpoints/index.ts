
const endpoints: string[] = [
	'./healthcheck/endpoint',
	'./user/create/endpoint',
	// './session/create/from-email/endpoint',
	'./session/create/from-password/endpoint',
	'./session/create/from-session/endpoint',
	'./session/create/from-temp-credential/endpoint',
	'./session/destroy/endpoint',
	'./session/introspect/endpoint',
	'./credential/application/create/endpoint',
	'./credential/password/update/endpoint',
	'./application/create/endpoint',
];

export const loadEndpoints = () => {
	endpoints.forEach((file) => require(file));
};
