const fs = require('fs')

function reset() {
  const str = JSON.stringify({
    "list": [
    ],
    "messageId": null,
    "availableIds": [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ]
  }, null, 2)
  fs.writeFileSync('data.json', str)
}

module.exports = reset