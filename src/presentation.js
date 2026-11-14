// Retain stored data while retiring the wording used by previous prototypes.
export function operationLabel(text = "") {
  return text
    .replace(/демо(?=[а-яё])/gi, "")
    .replace(/вымышленн[а-яё]*\s*/gi, "")
    .trim();
}
export function assistantText(text = "") {
  return (
    text
      .split(/(?<=[.!?])\s+/)
      .filter(
        (sentence) =>
          !/демо|вымышлен|подготовлен.*ответ|реальная.*не подключ/i.test(
            sentence,
          ),
      )
      .join(" ")
      .trim() || "Обсудим форму, составы и риски этого матча."
  );
}
