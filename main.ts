import { EditorPosition, Plugin } from "obsidian";

function generateId(): string {
  return Math.random().toString(36).substr(2, 6);
}

const isHeadingRegEx = /^#{1,6}\s+[^\s]/;
const blockIdRegEx = /\s\^([^\s]+)$/;

export default class MyPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const cursor = editor.getCursor("to");
        const line = editor.getLine(cursor.line);
        const basename = view.file.basename;

        const isHeading = isHeadingRegEx.test(line);

        menu.addItem((item) => {
          const onClick = (isEmbed: boolean) => {
            // Copy heading
            if (isHeading) {
              return navigator.clipboard.writeText(
                `${isEmbed ? "!" : ""}[[${basename}#${line.replace(
                  /^#+\s/,
                  ""
                )}]]`
              );
            }

            const match = line.match(blockIdRegEx);

            // Copy existing block id
            if (match) {
              return navigator.clipboard.writeText(
                `${isEmbed ? "!" : ""}[[${basename}#^${match[1]}]]`
              );
            }

            // Add a block id
            const end: EditorPosition = {
              line: cursor.line,
              ch: line.length,
            };

            const id = generateId();

            editor.replaceRange(` ^${id}`, end);
            navigator.clipboard.writeText(
              `${isEmbed ? "!" : ""}[[${basename}#^${id}]]`
            );
          };

          item
            .setTitle(isHeading ? "Copy link to heading" : "Copy link to block")
            .setIcon("links-coming-in")
            .onClick(() => onClick(false));

          item
            .setTitle(
              isHeading
                ? "Copy embedded link to heading"
                : "Copy embedded link to block"
            )
            .setIcon("links-coming-in")
            .onClick(() => onClick(true));
        });
      })
    );
  }
}
