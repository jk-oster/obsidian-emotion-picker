## Obsidian Emotion Picker

Paste an emotion / feeling into note, using customizable list of emotions (or sensible default one).

Click on an emotion to insert it as text at the current cursor position.

Available options (default values can be set in Settings tab):

-   add comma after (convenient if entering more than one emotion)
-   insert as [[link]]
-   insert as #tag
-   capitalize the word before inserting

![Plugin overview](./emotion-picker.png "Plugin overview")

### Emotion wheel

The picker shows an emotion wheel with three rings: core emotion, secondary emotion, and outer word. Click any segment to insert its name. Hover a segment to see its full path.

-   Use the **Wheel / List** switch in the picker to change the view. The choice is saved. You can also set the default view in the settings.
-   Keyboard: Tab moves into the wheel. Arrow left and right move between neighbours. Arrow down goes to the first child. Arrow up goes to the parent. Enter or Space inserts the word.
-   On mobile, a tap on a segment with children zooms into that branch. Tap the center to insert the zoomed emotion. Tap **Back** to zoom out.
-   Default wheels exist for English, Spanish, Swedish, and German. Change the language with **Override locale** in the settings. The plugin saves your edits for each language. When you switch back, the plugin restores them. **Reset to locale default** resets the current language only.

### Edit the emotion tree

Open the settings and find **Emotion tree**. Each row is one emotion. Edit the name, change the color of a core emotion, move a row up or down, add a word under a row, or delete a row. Changes save at once. Click a row arrow to show or hide its words. To delete a row that has words, click the delete button twice.

### Custom emotion tree (JSON)

Open **Advanced** in the settings, paste a JSON array into **Custom tree (JSON)**, and press **Import tree**. Use **Copy current tree as JSON** to get a template.

```json
[
	{
		"id": "joy",
		"name": "Joy",
		"color": "#c1e08d",
		"children": [
			{
				"id": "joy/proud",
				"name": "Proud",
				"children": [{ "id": "joy/proud/confident", "name": "confident" }]
			}
		]
	}
]
```

Rules: every node needs a unique `id` and a `name` (up to 40 characters). Only top-level nodes need a `color` (`#rrggbb`). Use `children` for up to 3 levels and 500 nodes in total. An invalid import changes nothing. Lists from older plugin versions convert to a two-level tree automatically. The plugin keeps the old list in `data.json`.

The primary purpose is to provide an easier way to add entries to daily journal, emotions / mood tracker, etc.
