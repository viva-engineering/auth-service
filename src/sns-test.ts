
import { SNS } from 'aws-sdk';

const sns = new SNS({
	endpoint: 'localhost:9000',
	sslEnabled: false,
	region: 'fake-region',
	accessKeyId: 'access_key',
	secretAccessKey: 'secret_access_key'
});

const params: SNS.PublishInput = {
	Message: 'test',
	PhoneNumber: '+13607138824',
	MessageAttributes: {
		foo: {
			DataType: 'String',
			StringValue: 'test'
		},
		bar: {
			DataType: 'Binary',
			BinaryValue: Buffer.from('hello', 'utf8')
		},
		baz: {
			DataType: 'String.Array',
			StringValue: '["foo","bar","baz"]'
		}
	}
};

sns.publish(params, (error, result) => {
	if (error) {
		console.log({ error: error.stack });
	}

	else {
		console.log(result);
	}
});

