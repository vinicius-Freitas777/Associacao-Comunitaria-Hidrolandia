
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");

const html = fs.readFileSync(
    path.join(raiz, "index.html"), "utf8"
);

const css = fs.readFileSync(
    path.join(raiz, "style.css"), "utf8"
);

const js = fs.readFileSync(
    path.join(raiz, "script.js"), "utf8"
);

test("HTML possui idioma pt-BR", () => {
    assert.match(html, /lang=["']pt-BR["']/i);
});

test("HTML possui conteúdo principal", () => {
    assert.match(html, /<main\b/i);
});

test("HTML carrega o CSS", () => {
    assert.match(html, /href=["']style\.css["']/i);
});

test("HTML carrega o JavaScript", () => {
    assert.match(html, /src=["']script\.js["']/i);
});

test("CSS possui responsividade", () => {
    assert.match(css, /@media/i);
});

test("JavaScript possui suporte à tecla Escape", () => {
    assert.match(js, /Escape/);
});
