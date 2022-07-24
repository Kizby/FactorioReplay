let fs = require('fs')

fs.readFile('./results.json', function (err1, code1) {
  fs.readFile('./replay01.dat', function (err2, code2) {
    let codes = JSON.parse(code1.toString())
    let str = code2.toString('hex')
    let temp = ''
    for (let i = 0; i < str.length; i += 2) {
      temp +=
        '(' +
        str[i] +
        str[i + 1] +
        `,${Number('0x' + str[i] + str[i + 1])}) ` +
        codes[str[i] + str[i + 1]] +
        '\n'
    }
    fs.writeFile('results.txt', temp, (a, b) => {})
  })
})
