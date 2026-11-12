import { DEFAULT_EMOTION_TREE } from "./en";
import { translateTree, TreeNames } from "./translate";

/** Spanish names. Masculine singular forms. Needs a native speaker review. */
const NAMES: TreeNames = {
	joy: ["Alegría", {
		proud: ["Orgulloso", { confident: "seguro", triumphant: "triunfante", accomplished: "realizado" }],
		content: ["Contento", { satisfied: "satisfecho", peaceful: "sereno", relieved: "aliviado" }],
		cheerful: ["Alegre", { happy: "feliz", amused: "divertido", jovial: "jovial", blissful: "dichoso" }],
		excited: ["Emocionado", { eager: "ávido", enthusiastic: "entusiasta", euphoric: "eufórico", thrilled: "ilusionado" }],
		hopeful: ["Esperanzado", { optimistic: "optimista", encouraged: "animado", inspired: "inspirado" }],
	}],
	love: ["Amor", {
		affectionate: ["Cariñoso", { loving: "amoroso", tender: "tierno", caring: "atento" }],
		romantic: ["Romántico", { passionate: "apasionado", attracted: "atraído", sentimental: "sentimental" }],
		compassionate: ["Compasivo", { kind: "amable", understanding: "comprensivo", sympathetic: "solidario" }],
		grateful: ["Agradecido", { thankful: "reconocido", appreciative: "apreciativo", touched: "conmovido" }],
		trusting: ["Confiado", { secure: "protegido", accepted: "aceptado", connected: "conectado" }],
	}],
	surprise: ["Sorpresa", {
		amazed: ["Maravillado", { astonished: "asombrado", awestruck: "admirado", impressed: "impresionado" }],
		shocked: ["Impactado", { startled: "sobresaltado", stunned: "atónito", dismayed: "consternado" }],
		confused: ["Confundido", { perplexed: "perplejo", puzzled: "desconcertado", disillusioned: "desilusionado" }],
		overwhelmed: ["Abrumado", { moved: "enternecido", breathless: "sin aliento", speechless: "sin palabras" }],
		curious: ["Curioso", { intrigued: "intrigado", fascinated: "fascinado" }],
	}],
	anger: ["Rabia", {
		furious: ["Furioso", { enraged: "enfurecido", hateful: "odioso", hostile: "hostil" }],
		frustrated: ["Frustrado", { irritated: "irritado", annoyed: "molesto", aggravated: "exasperado" }],
		agitated: ["Agitado", { tense: "tenso", restless: "inquieto", impatient: "impaciente" }],
		resentful: ["Resentido", { envious: "envidioso", jealous: "celoso", bitter: "amargado" }],
		disgusted: ["Asqueado", { contemptful: "despectivo", repulsed: "repugnado", disapproving: "crítico" }],
	}],
	sadness: ["Tristeza", {
		hurt: ["Herido", { wounded: "lastimado", betrayed: "traicionado", neglected: "desatendido" }],
		depressed: ["Deprimido", { hopeless: "desesperanzado", sorrowful: "afligido", despaired: "desesperado" }],
		disappointed: ["Decepcionado", { "let-down": "defraudado", displeased: "disgustado", discouraged: "desanimado" }],
		ashamed: ["Avergonzado", { guilty: "culpable", regretful: "arrepentido", embarrassed: "apenado" }],
		lonely: ["Solo", { isolated: "aislado", abandoned: "abandonado", "left-out": "excluido" }],
		powerless: ["Impotente", { defeated: "derrotado", exhausted: "agotado", "worn-out": "rendido" }],
	}],
	fear: ["Miedo", {
		scared: ["Asustado", { frightened: "atemorizado", terrified: "aterrado", panicking: "en pánico" }],
		anxious: ["Ansioso", { nervous: "nervioso", worried: "preocupado", uneasy: "intranquilo" }],
		insecure: ["Inseguro", { inadequate: "inadecuado", inferior: "inferior", doubtful: "dudoso" }],
		threatened: ["Amenazado", { intimidated: "intimidado", exposed: "expuesto", vulnerable: "vulnerable" }],
		dreadful: ["Espantado", { mortified: "mortificado", horrified: "horrorizado", alarmed: "alarmado" }],
	}],
};

export const SPANISH_EMOTION_TREE = translateTree(DEFAULT_EMOTION_TREE, NAMES);
export const SPANISH_NAMES = NAMES;
