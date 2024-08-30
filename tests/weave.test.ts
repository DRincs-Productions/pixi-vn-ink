import { PixiVNJson } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-gathers
 */
test('Gathers', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
    let res = convertInkText(`
-> start
=== start ==
"What's that?" my master asked.
	*	"I am somewhat tired[."]," I repeated.
		"Really," he responded. "How deleterious."
	*	"Nothing, Monsieur!"[] I replied.
		"Very good, then."
	*  "I said, this journey is appalling[."] and I want no more of it."
	"Ah," he replied, not unkindly. "I see you are feeling frustrated. Tomorrow, things will improve."

-	With that Monsieur Fogg left the room.
-> DONE
`);
    expect(res).toEqual(expected);
});

/**
 * https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#options-and-gathers-form-chains-of-content
 */
test('Options and gathers form chains of content', async () => {
    let expected: PixiVNJson = {
        labels: {}
    }
    let res = convertInkText(`
-> start
=== start ==
I ran through the forest, the dogs snapping at my heels.

	* 	I checked the jewels[] were still in my pocket, and the feel of them brought a spring to my step. <>

	*  I did not pause for breath[] but kept on running. <>

	*	I cheered with joy. <>

- 	The road could not be much further! Mackie would have the engine running, and then I'd be safe.

	*	I reached the road and looked about[]. And would you believe it?
	* 	I should interrupt to say Mackie is normally very reliable[]. He's never once let me down. Or rather, never once, previously to that night.

-	The road was empty. Mackie was nowhere to be seen.
-> DONE
`);
    expect(res).toEqual(expected);
});
