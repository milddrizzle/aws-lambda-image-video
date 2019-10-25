const fs = require('fs');

module.exports = function size(name) {
  const stats = fs.statSync(name);
  return stats ? `${(stats.size / 1024).toFixed(2)}Kb` : 0;
}
