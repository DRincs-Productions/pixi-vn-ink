import { test } from 'vitest';
import { convertInkText } from './src/functions/inkjsCompiler';

test('Choices test 1', async () => {
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello back!
	Nice to hear from you!
`);
});


test('Choices test 2', async () => {
	let res = convertInkText(`
=== test ===
Hello world!
*	Hello back!
	Nice to hear from you!
Hello world!2
*	Hello back!3
	Nice to hear from you!3
*	Hello back!4
	Nice to hear from you!4
`);
});
