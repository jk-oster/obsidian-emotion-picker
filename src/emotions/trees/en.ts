import { buildTree } from "./build";

/**
 * English default tree: 6 core emotions, 31 secondary emotions, 94 tertiary words.
 * The grouping is our own. Colors match the old flat list.
 */
export const DEFAULT_EMOTION_TREE = buildTree([
	{
		key: "joy",
		name: "Joy",
		color: "#c1e08d",
		groups: [
			{ name: "Proud", words: ["confident", "triumphant", "accomplished"] },
			{ name: "Content", words: ["satisfied", "peaceful", "relieved"] },
			{ name: "Cheerful", words: ["happy", "amused", "jovial", "blissful"] },
			{ name: "Excited", words: ["eager", "enthusiastic", "euphoric", "thrilled"] },
			{ name: "Hopeful", words: ["optimistic", "encouraged", "inspired"] },
		],
	},
	{
		key: "love",
		name: "Love",
		color: "#e8c3da",
		groups: [
			{ name: "Affectionate", words: ["loving", "tender", "caring"] },
			{ name: "Romantic", words: ["passionate", "attracted", "sentimental"] },
			{ name: "Compassionate", words: ["kind", "understanding", "sympathetic"] },
			{ name: "Grateful", words: ["thankful", "appreciative", "touched"] },
			{ name: "Trusting", words: ["secure", "accepted", "connected"] },
		],
	},
	{
		key: "surprise",
		name: "Surprise",
		color: "#94d4d3",
		groups: [
			{ name: "Amazed", words: ["astonished", "awestruck", "impressed"] },
			{ name: "Shocked", words: ["startled", "stunned", "dismayed"] },
			{ name: "Confused", words: ["perplexed", "puzzled", "disillusioned"] },
			{ name: "Overwhelmed", words: ["moved", "breathless", "speechless"] },
			{ name: "Curious", words: ["intrigued", "fascinated"] },
		],
	},
	{
		key: "anger",
		name: "Anger",
		color: "#b84444",
		groups: [
			{ name: "Furious", words: ["enraged", "hateful", "hostile"] },
			{ name: "Frustrated", words: ["irritated", "annoyed", "aggravated"] },
			{ name: "Agitated", words: ["tense", "restless", "impatient"] },
			{ name: "Resentful", words: ["envious", "jealous", "bitter"] },
			{ name: "Disgusted", words: ["contemptful", "repulsed", "disapproving"] },
		],
	},
	{
		key: "sadness",
		name: "Sadness",
		color: "#4e72a3",
		groups: [
			{ name: "Hurt", words: ["wounded", "betrayed", "neglected"] },
			{ name: "Depressed", words: ["hopeless", "sorrowful", "despaired"] },
			{ name: "Disappointed", words: ["let down", "displeased", "discouraged"] },
			{ name: "Ashamed", words: ["guilty", "regretful", "embarrassed"] },
			{ name: "Lonely", words: ["isolated", "abandoned", "left out"] },
			{ name: "Powerless", words: ["defeated", "exhausted", "worn out"] },
		],
	},
	{
		key: "fear",
		name: "Fear",
		color: "#dbab4b",
		groups: [
			{ name: "Scared", words: ["frightened", "terrified", "panicking"] },
			{ name: "Anxious", words: ["nervous", "worried", "uneasy"] },
			{ name: "Insecure", words: ["inadequate", "inferior", "doubtful"] },
			{ name: "Threatened", words: ["intimidated", "exposed", "vulnerable"] },
			{ name: "Dreadful", words: ["mortified", "horrified", "alarmed"] },
		],
	},
]);
