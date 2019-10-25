const REGEXP = /[-_]+(.)?/g;

export default function toCamelCase(text) {
  return text.replace(REGEXP, (_, group) => group ? group.toUpperCase() : '');
}