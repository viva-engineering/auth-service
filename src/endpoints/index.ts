
const endpoints: string[] = [
	'./healthcheck/endpoint',
	'./user/create/endpoint',
	// './session/create/from-email/endpoint',
	'./session/create/from-password/endpoint',
	'./session/create/from-session/endpoint',
	'./session/destroy/endpoint',
	'./session/introspect/endpoint',
	// './credential/password/create/endpoint',
	'./application/create/endpoint',
];

export const loadEndpoints = () => {
	endpoints.forEach((file) => require(file));
};
