import { EditorPosition, ListItemCache, Plugin, SectionCache } from "obsidian";

function generateId(): string {
  return Math.random().toString(36).substr(2, 6);
}

function shouldInsertAfter(block: ListItemCache | SectionCache) {
  if ((block as any).type) {
    return [
      "blockquote",
      "code",
      "table",
      "comment",
      "footnoteDefinition",
    ].includes((block as SectionCache).type);
  }
}

export default class MyPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const cursor = editor.getCursor("to");
        const fileCache = this.app.metadataCache.getFileCache(view.file);

        let blockCache: ListItemCache | SectionCache = (
          fileCache?.sections || []
        ).find((section) => {
          return (
            section.position.start.line <= cursor.line &&
            section.position.end.line >= cursor.line
          );
        });

        if (!blockCache) return;

        if (blockCache.type === "list") {
          blockCache = (fileCache?.listItems || []).find((item) => {
            return (
              item.position.start.line <= cursor.line &&
              item.position.end.line >= cursor.line
            );
          });
        }

        const isHeading = (blockCache as any).type === "heading";

        const onClick = (isEmbed: boolean) => {
          // Copy heading
          if (isHeading) {
            const heading = fileCache.headings.find((heading) => {
              return (
                heading.position.start.line === blockCache.position.start.line
              );
            });

            return (
              heading &&
              navigator.clipboard.writeText(
                `${
                  isEmbed ? "!" : ""
                }${this.app.fileManager.generateMarkdownLink(
                  view.file,
                  "",
                  "#" + heading.heading
                )}`
              )
            );
          }

          const blockId = blockCache.id;

          // Copy existing block id
          if (blockId) {
            return navigator.clipboard.writeText(
              `${isEmbed ? "!" : ""}${this.app.fileManager.generateMarkdownLink(
                view.file,
                "",
                "#^" + blockId
              )}`
            );
          }

          // Add a block id
          const sectionEnd = blockCache.position.end;
          const end: EditorPosition = {
            ch: sectionEnd.col,
            line: sectionEnd.line,
          };

          const id = generateId();
          const spacer = shouldInsertAfter(blockCache) ? "\n\n" : " ";

          editor.replaceRange(`${spacer}^${id}`, end);
          navigator.clipboard.writeText(
            `${isEmbed ? "!" : ""}${this.app.fileManager.generateMarkdownLink(
              view.file,
              "",
              "#^" + id
            )}`
          );
        };

        menu.addItem((item) => {
          item
            .setTitle(isHeading ? "Copy link to heading" : "Copy link to block")
            .setIcon("links-coming-in")
            .onClick(() => onClick(false));
        });

        menu.addItem((item) => {
          item
            .setTitle(isHeading ? "Copy heading embed" : "Copy block embed")
            .setIcon("links-coming-in")
            .onClick(() => onClick(true));
        });
      })
    );
  }
}
