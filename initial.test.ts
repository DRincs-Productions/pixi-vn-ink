import { test } from 'vitest';
import { convertorInkToJson } from './src/functions/inkjsCompiler';

test('convertorInkToJson', async () => {
    convertorInkToJson(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
`);
});
