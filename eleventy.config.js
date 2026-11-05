const fs = require("node:fs");
const path = require("node:path");

const read = (relPath) => fs.readFileSync(path.join(__dirname, relPath), "utf-8");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/images": "images" });
    eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
    eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
    eleventyConfig.addWatchTarget("src/css/");
    eleventyConfig.addWatchTarget("src/js/");

    // CSS und JS werden eingebettet: Der Draft-Server komprimiert nur HTML.
    eleventyConfig.addShortcode("inlineCss", (relPath) =>
        read(relPath)
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\s+/g, " ")
            .replace(/\s*([{};,>])\s*/g, "$1")
            .replace(/;}/g, "}")
            .trim()
    );
    eleventyConfig.addShortcode("inlineJs", (relPath) =>
        read(relPath)
            .replace(/^\s*\/\/.*$/gm, "")
            .replace(/\n\s+/g, "\n")
            .replace(/\n+/g, "\n")
            .trim()
    );

    // Buchstaben einzeln in <span>, damit sie hüpfen können.
    // Das aria-label auf dem Eltern-Element liefert den Text für Screenreader.
    // start: laufende Nummer des ersten Buchstabens, für die Verzögerung der Animation.
    eleventyConfig.addFilter("letters", (text, start = 0) => {
        let n = start;
        return String(text).split(" ").map((word) =>
            `<span class="wort">${[...word].map((c) => `<span class="bu" style="--i:${n++}" aria-hidden="true">${c}</span>`).join("")}</span>`
        ).join(" ");
    });

    return {
        dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    };
};
