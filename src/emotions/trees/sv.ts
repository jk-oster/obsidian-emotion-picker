import { DEFAULT_EMOTION_TREE } from "./en";
import { translateTree, TreeNames } from "./translate";

/** Swedish names. Needs a native speaker review. */
const NAMES: TreeNames = {
	joy: ["Glädje", {
		proud: ["Stolt", { confident: "självsäker", triumphant: "triumferande", accomplished: "framgångsrik" }],
		content: ["Nöjd", { satisfied: "tillfredsställd", peaceful: "fridfull", relieved: "lättad" }],
		cheerful: ["Glad", { happy: "lycklig", amused: "road", jovial: "uppsluppen", blissful: "salig" }],
		excited: ["Upprymd", { eager: "ivrig", enthusiastic: "entusiastisk", euphoric: "euforisk", thrilled: "exalterad" }],
		hopeful: ["Hoppfull", { optimistic: "optimistisk", encouraged: "uppmuntrad", inspired: "inspirerad" }],
	}],
	love: ["Kärlek", {
		affectionate: ["Tillgiven", { loving: "kärleksfull", tender: "öm", caring: "omtänksam" }],
		romantic: ["Romantisk", { passionate: "passionerad", attracted: "attraherad", sentimental: "sentimental" }],
		compassionate: ["Medkännande", { kind: "vänlig", understanding: "förstående", sympathetic: "deltagande" }],
		grateful: ["Tacksam", { thankful: "erkänsam", appreciative: "uppskattande", touched: "berörd" }],
		trusting: ["Trygg", { secure: "säker", accepted: "accepterad", connected: "förbunden" }],
	}],
	surprise: ["Överraskad", {
		amazed: ["Förundrad", { astonished: "förbluffad", awestruck: "vördnadsfull", impressed: "imponerad" }],
		shocked: ["Chockad", { startled: "uppskrämd", stunned: "bedövad", dismayed: "bestört" }],
		confused: ["Förvirrad", { perplexed: "perplex", puzzled: "brydd", disillusioned: "desillusionerad" }],
		overwhelmed: ["Överväldigad", { moved: "rörd", breathless: "andfådd", speechless: "mållös" }],
		curious: ["Nyfiken", { intrigued: "intresserad", fascinated: "fascinerad" }],
	}],
	anger: ["Ilska", {
		furious: ["Rasande", { enraged: "ursinnig", hateful: "hatisk", hostile: "fientlig" }],
		frustrated: ["Frustrerad", { irritated: "irriterad", annoyed: "störd", aggravated: "förargad" }],
		agitated: ["Upprörd", { tense: "spänd", restless: "rastlös", impatient: "otålig" }],
		resentful: ["Bitter", { envious: "avundsjuk", jealous: "svartsjuk", bitter: "förbittrad" }],
		disgusted: ["Äcklad", { contemptful: "föraktfull", repulsed: "kväljd", disapproving: "ogillande" }],
	}],
	sadness: ["Sorg", {
		hurt: ["Sårad", { wounded: "kränkt", betrayed: "sviken", neglected: "försummad" }],
		depressed: ["Nedstämd", { hopeless: "hopplös", sorrowful: "bedrövad", despaired: "förtvivlad" }],
		disappointed: ["Besviken", { "let-down": "snopen", displeased: "missnöjd", discouraged: "modfälld" }],
		ashamed: ["Skamsen", { guilty: "skuldmedveten", regretful: "ångerfull", embarrassed: "generad" }],
		lonely: ["Ensam", { isolated: "isolerad", abandoned: "övergiven", "left-out": "utanför" }],
		powerless: ["Maktlös", { defeated: "besegrad", exhausted: "utmattad", "worn-out": "slutkörd" }],
	}],
	fear: ["Rädsla", {
		scared: ["Rädd", { frightened: "skrämd", terrified: "skräckslagen", panicking: "panikslagen" }],
		anxious: ["Orolig", { nervous: "nervös", worried: "bekymrad", uneasy: "otrygg" }],
		insecure: ["Osäker", { inadequate: "otillräcklig", inferior: "underlägsen", doubtful: "tveksam" }],
		threatened: ["Hotad", { intimidated: "kuvad", exposed: "utsatt", vulnerable: "sårbar" }],
		dreadful: ["Skräckfylld", { mortified: "förödmjukad", horrified: "förfärad", alarmed: "alarmerad" }],
	}],
};

export const SWEDISH_EMOTION_TREE = translateTree(DEFAULT_EMOTION_TREE, NAMES);
export const SWEDISH_NAMES = NAMES;
