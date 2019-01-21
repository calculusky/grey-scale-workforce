const iconv = require('iconv-lite');
const encoding = require('iconv-lite/encodings');
iconv.encodings = encoding;

// const okObject = {
//     message: () => "Ok",
//     pass: true
// };
// expect.extend({
//     toMatchObjectOrNull(received, argument) {
//         // console.log('Testing Received', received);
//         // console.log(argument);
//         if (received === null) return okObject;
//         const val = expect(received).objectContaining(argument);
//         console.log('Something', val);
//     }
// });