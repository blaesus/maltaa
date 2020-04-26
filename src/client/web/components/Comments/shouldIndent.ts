const canvas = document.createElement("canvas");

export function heuristicallyShouldIndent(html: string, containerWidth: number): boolean {
    if (html.length < 100) {
        return false;
    }
    if (!containerWidth) {
        return false;
    }
    function getTextWidth(text: string, font: string) {
        const context = canvas.getContext("2d");
        if (context) {
            context.font = font;
            const metrics = context.measureText(text);
            return metrics.width;
        }
        else {
            return 16 * text.length;
        }
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const paragraphs = Array.from(tmp.querySelectorAll("p"));
    if (paragraphs.length <= 1) {
        return false;
    }
    const paragraphWidths = paragraphs.map(p => getTextWidth(p.innerText, "normal 16px serif"));
    return paragraphWidths.some(width => width > containerWidth);
}

