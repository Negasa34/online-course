const { parseDocument } = require("htmlparser2");
const { selectAll } = require("css-select");

const MAX_HTML_LENGTH = 20000;

function findMatches(root, selector) {
  try {
    return selectAll(selector, root);
  } catch {
    throw new Error("The stored exercise contains an unsupported HTML selector");
  }
}

function nodeText(node) {
  if (node.type === "text") return node.data;
  return (node.children || []).map(nodeText).join("");
}

function checkHtmlRequirements(html, requirements) {
  if (typeof html !== "string" || !html.trim()) {
    return { passed: false, results: requirements.map((_, requirementIndex) => ({ requirementIndex, passed: false })) };
  }
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_LENGTH) {
    const error = new Error(`HTML submissions must be ${MAX_HTML_LENGTH} bytes or fewer`);
    error.status = 413;
    throw error;
  }

  const document = parseDocument(html, { decodeEntities: true });
  const results = requirements.map((requirement, requirementIndex) => {
    const matches = findMatches(document, requirement.selector);
    let passed = matches.length > 0;
    if (requirement.type === "element-text") {
      const expected = requirement.text.trim().replace(/\s+/g, " ");
      passed = matches.some((node) => nodeText(node).replace(/\s+/g, " ").trim().includes(expected));
    } else if (requirement.type === "attribute-equals") {
      passed = matches.some((node) => node.attribs?.[requirement.attribute] === requirement.value);
    }
    return { requirementIndex, passed };
  });

  return { passed: results.length > 0 && results.every((result) => result.passed), results };
}

module.exports = { MAX_HTML_LENGTH, checkHtmlRequirements };
