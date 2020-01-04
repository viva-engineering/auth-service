
const nanosecondsPerMillisecond = 10e5;
const oneMinute = 60;
const oneHour = 60 * 60;

/**
 * Returns a formatted duration string from a `process.hrtime()` result. Output can look like
 * "4.56789ms", "3sec 4.56789ms", "2min 3sec 4.56789ms", or "1hr 2min 3sec 4.56789ms"
 */
export const formatDuration = ([ wholeSeconds, nanoseconds ]: [ number, number ]) : string => {
	const milliseconds = `${(nanoseconds / nanosecondsPerMillisecond).toPrecision(6)}ms`;

	if (wholeSeconds < 1) {
		return milliseconds;
	}

	if (wholeSeconds < oneMinute) {
		return `${wholeSeconds}sec ${milliseconds}`;
	}

	if (wholeSeconds < oneHour) {
		const minutes = Math.floor(wholeSeconds / oneMinute);
		const remainingSeconds = wholeSeconds % oneMinute;

		return `${minutes}min ${remainingSeconds}sec ${milliseconds}`;
	}

	const hours = Math.floor(wholeSeconds / oneHour);
	const remainingMinutes = Math.floor(wholeSeconds % oneHour / oneMinute);
	const remainingSeconds = Math.floor(wholeSeconds % oneHour % oneMinute);

	return `${hours}hr ${remainingMinutes}min ${remainingSeconds}sec ${milliseconds}`;
};
