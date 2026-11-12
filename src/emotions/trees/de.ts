import { DEFAULT_EMOTION_TREE } from "./en";
import { translateTree, TreeNames } from "./translate";

/** German names (Austrian usage where it differs). Needs a native speaker review. */
const NAMES: TreeNames = {
	joy: ["Freude", {
		proud: ["Stolz", { confident: "selbstsicher", triumphant: "triumphierend", accomplished: "erfolgreich" }],
		content: ["Zufrieden", { satisfied: "befriedigt", peaceful: "friedlich", relieved: "erleichtert" }],
		cheerful: ["Fröhlich", { happy: "glücklich", amused: "amüsiert", jovial: "heiter", blissful: "selig" }],
		excited: ["Begeistert", { eager: "eifrig", enthusiastic: "enthusiastisch", euphoric: "euphorisch", thrilled: "aufgeregt" }],
		hopeful: ["Hoffnungsvoll", { optimistic: "optimistisch", encouraged: "ermutigt", inspired: "inspiriert" }],
	}],
	love: ["Liebe", {
		affectionate: ["Zärtlich", { loving: "liebevoll", tender: "zart", caring: "fürsorglich" }],
		romantic: ["Romantisch", { passionate: "leidenschaftlich", attracted: "angezogen", sentimental: "gefühlvoll" }],
		compassionate: ["Mitfühlend", { kind: "freundlich", understanding: "verständnisvoll", sympathetic: "teilnahmsvoll" }],
		grateful: ["Dankbar", { thankful: "erkenntlich", appreciative: "wertschätzend", touched: "gerührt" }],
		trusting: ["Vertrauensvoll", { secure: "geborgen", accepted: "akzeptiert", connected: "verbunden" }],
	}],
	surprise: ["Überraschung", {
		amazed: ["Erstaunt", { astonished: "verblüfft", awestruck: "ehrfürchtig", impressed: "beeindruckt" }],
		shocked: ["Schockiert", { startled: "erschrocken", stunned: "fassungslos", dismayed: "bestürzt" }],
		confused: ["Verwirrt", { perplexed: "ratlos", puzzled: "verdutzt", disillusioned: "ernüchtert" }],
		overwhelmed: ["Überwältigt", { moved: "bewegt", breathless: "atemlos", speechless: "sprachlos" }],
		curious: ["Neugierig", { intrigued: "interessiert", fascinated: "fasziniert" }],
	}],
	anger: ["Wut", {
		furious: ["Wütend", { enraged: "rasend", hateful: "hasserfüllt", hostile: "feindselig" }],
		frustrated: ["Frustriert", { irritated: "gereizt", annoyed: "genervt", aggravated: "verärgert" }],
		agitated: ["Aufgewühlt", { tense: "angespannt", restless: "rastlos", impatient: "ungeduldig" }],
		resentful: ["Missgünstig", { envious: "neidisch", jealous: "eifersüchtig", bitter: "verbittert" }],
		disgusted: ["Angewidert", { contemptful: "verächtlich", repulsed: "abgestoßen", disapproving: "missbilligend" }],
	}],
	sadness: ["Traurigkeit", {
		hurt: ["Verletzt", { wounded: "gekränkt", betrayed: "verraten", neglected: "vernachlässigt" }],
		depressed: ["Bedrückt", { hopeless: "hoffnungslos", sorrowful: "betrübt", despaired: "verzweifelt" }],
		disappointed: ["Enttäuscht", { "let-down": "zurückgesetzt", displeased: "unzufrieden", discouraged: "entmutigt" }],
		ashamed: ["Beschämt", { guilty: "schuldig", regretful: "reumütig", embarrassed: "verlegen" }],
		lonely: ["Einsam", { isolated: "isoliert", abandoned: "verlassen", "left-out": "ausgegrenzt" }],
		powerless: ["Machtlos", { defeated: "geschlagen", exhausted: "erschöpft", "worn-out": "ausgelaugt" }],
	}],
	fear: ["Angst", {
		scared: ["Verängstigt", { frightened: "furchtsam", terrified: "entsetzt", panicking: "panisch" }],
		anxious: ["Besorgt", { nervous: "nervös", worried: "sorgenvoll", uneasy: "unruhig" }],
		insecure: ["Unsicher", { inadequate: "unzulänglich", inferior: "minderwertig", doubtful: "zweifelnd" }],
		threatened: ["Bedroht", { intimidated: "eingeschüchtert", exposed: "ausgeliefert", vulnerable: "verletzlich" }],
		dreadful: ["Beklommen", { mortified: "bloßgestellt", horrified: "entgeistert", alarmed: "alarmiert" }],
	}],
};

/**
 * German nouns keep their capital letter. All other German names are lowercase.
 * The six core emotions are nouns. "Stolz" is the only noun among the groups.
 * The outer words are all adjectives or participles.
 */
export const GERMAN_NOUN_IDS = [
	"joy",
	"love",
	"surprise",
	"anger",
	"sadness",
	"fear",
	"joy/proud",
];

export const GERMAN_EMOTION_TREE = translateTree(DEFAULT_EMOTION_TREE, NAMES, GERMAN_NOUN_IDS);
export const GERMAN_NAMES = NAMES;
