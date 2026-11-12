import { ValidationResult, validateTree } from "../emotions/tree";

/** Parse and validate a JSON string that holds an emotion tree. Never throws. */
export function importTree(raw: string): ValidationResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		return { errors: [`The text is not valid JSON: ${(error as Error).message}`] };
	}
	return validateTree(parsed);
}
