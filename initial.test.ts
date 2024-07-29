import { test } from 'vitest';
import { convertorInkToJson, getJsonLabels } from './src/functions/inkjsCompiler';

test('convertorInkToJson', async () => {
    let json = convertorInkToJson(`
=== back_in_london ===

We arrived into London at 9.45pm exactly.
-> hurry_home

=== hurry_home ===
We hurried home to Savile Row as fast as we could.
`);

    getJsonLabels(json)

});
