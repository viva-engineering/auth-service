
import { LoadOptions, EnvFileSource, AwsParameterStoreSource } from '@viva-eng/config-loader';

export const options: LoadOptions<NodeJS.ProcessEnv> = {
	sources: [ ],
	writeTo: process.env,
	transformKeys(key) {
		return key.split('/').pop().toLowerCase();
	}
};

const envFiles = process.env.cfg_env_files;
const ssmPaths = process.env.cfg_ssm_paths;
const ssmParams = process.env.cfg_ssm_params;

if (envFiles) {
	options.sources.push(new EnvFileSource({
		files: envFiles.split(';')
	}));
}

if (ssmPaths || ssmParams) {
	options.sources.push(new AwsParameterStoreSource({
		params: ssmParams ? ssmParams.split(';') : [ ],
		paramPaths: ssmPaths ? ssmPaths.split(';') : [ ]
	}));
}
