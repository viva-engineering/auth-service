
import { Suite } from '@viva-eng/perf-test';
import { NewUserFlow } from '../user-flows/new-user';

export const suite = new Suite({
	name: 'New Users',
	phases: [
		{ name: 'Ramp Up', duration: 60, flowRate: 1, rampTo: 20 },
		{ name: 'Sustain', duration: 60, flowRate: 20 },
		{ name: 'Ramp Down', duration: 60, flowRate: 20, rampTo: 1 }
	],
	flows: [
		{ flow: NewUserFlow, weight: 1 }
	]
});
