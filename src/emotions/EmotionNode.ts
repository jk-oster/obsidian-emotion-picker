export interface EmotionNode {
	id: string;
	name: string;
	/** Only level-1 nodes store a color. Deeper levels derive it. */
	color?: string;
	children?: EmotionNode[];
}
