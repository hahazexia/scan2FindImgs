"use strict";
exports.id = 1;
exports.ids = [1];
exports.modules = {

/***/ 68:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JSONRepairError: () => (/* reexport safe */ _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError),
/* harmony export */   jsonrepair: () => (/* reexport safe */ _regular_jsonrepair_js__WEBPACK_IMPORTED_MODULE_0__.jsonrepair)
/* harmony export */ });
/* harmony import */ var _regular_jsonrepair_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(69);
/* harmony import */ var _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(70);
// Cross-platform, non-streaming JavaScript API


//# sourceMappingURL=index.js.map

/***/ }),

/***/ 69:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   jsonrepair: () => (/* binding */ jsonrepair)
/* harmony export */ });
/* harmony import */ var _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(70);
/* harmony import */ var _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(71);


const controlCharacters = {
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t'
};

// map with all escape characters
const escapeCharacters = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t'
  // note that \u is handled separately in parseString()
};

/**
 * Repair a string containing an invalid JSON document.
 * For example changes JavaScript notation into JSON notation.
 *
 * Example:
 *
 *     try {
 *       const json = "{name: 'John'}"
 *       const repaired = jsonrepair(json)
 *       console.log(repaired)
 *       // '{"name": "John"}'
 *     } catch (err) {
 *       console.error(err)
 *     }
 *
 */
function jsonrepair(text) {
  let i = 0; // current index in text
  let output = ''; // generated output

  const processed = parseValue();
  if (!processed) {
    throwUnexpectedEnd();
  }
  const processedComma = parseCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma);
  if (processedComma) {
    parseWhitespaceAndSkipComments();
  }
  if ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isStartOfValue)(text[i]) && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.endsWithCommaOrNewline)(output)) {
    // start of a new value after end of the root level object: looks like
    // newline delimited JSON -> turn into a root level array
    if (!processedComma) {
      // repair missing comma
      output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ',');
    }
    parseNewlineDelimitedJSON();
  } else if (processedComma) {
    // repair: remove trailing comma
    output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.stripLastOccurrence)(output, ',');
  }

  // repair redundant end quotes
  while (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBrace || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBracket) {
    i++;
    parseWhitespaceAndSkipComments();
  }
  if (i >= text.length) {
    // reached the end of the document properly
    return output;
  }
  throwUnexpectedCharacter();
  function parseValue() {
    parseWhitespaceAndSkipComments();
    const processed = parseObject() || parseArray() || parseString() || parseNumber() || parseKeywords() || parseUnquotedString();
    parseWhitespaceAndSkipComments();
    return processed;
  }
  function parseWhitespaceAndSkipComments() {
    const start = i;
    let changed = parseWhitespace();
    do {
      changed = parseComment();
      if (changed) {
        changed = parseWhitespace();
      }
    } while (changed);
    return i > start;
  }
  function parseWhitespace() {
    let whitespace = '';
    let normal;
    while ((normal = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isWhitespace)(text.charCodeAt(i))) || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isSpecialWhitespace)(text.charCodeAt(i))) {
      if (normal) {
        whitespace += text[i];
      } else {
        // repair special whitespace
        whitespace += ' ';
      }
      i++;
    }
    if (whitespace.length > 0) {
      output += whitespace;
      return true;
    }
    return false;
  }
  function parseComment() {
    // find a block comment '/* ... */'
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeSlash && text.charCodeAt(i + 1) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeAsterisk) {
      // repair block comment by skipping it
      while (i < text.length && !atEndOfBlockComment(text, i)) {
        i++;
      }
      i += 2;
      return true;
    }

    // find a line comment '// ...'
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeSlash && text.charCodeAt(i + 1) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeSlash) {
      // repair line comment by skipping it
      while (i < text.length && text.charCodeAt(i) !== _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeNewline) {
        i++;
      }
      return true;
    }
    return false;
  }
  function parseCharacter(code) {
    if (text.charCodeAt(i) === code) {
      output += text[i];
      i++;
      return true;
    }
    return false;
  }
  function skipCharacter(code) {
    if (text.charCodeAt(i) === code) {
      i++;
      return true;
    }
    return false;
  }
  function skipEscapeCharacter() {
    return skipCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeBackslash);
  }

  /**
   * Skip ellipsis like "[1,2,3,...]" or "[1,2,3,...,9]" or "[...,7,8,9]"
   * or a similar construct in objects.
   */
  function skipEllipsis() {
    parseWhitespaceAndSkipComments();
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDot && text.charCodeAt(i + 1) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDot && text.charCodeAt(i + 2) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDot) {
      // repair: remove the ellipsis (three dots) and optionally a comma
      i += 3;
      parseWhitespaceAndSkipComments();
      skipCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma);
      return true;
    }
    return false;
  }

  /**
   * Parse an object like '{"key": "value"}'
   */
  function parseObject() {
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeOpeningBrace) {
      output += '{';
      i++;
      parseWhitespaceAndSkipComments();

      // repair: skip leading comma like in {, message: "hi"}
      if (skipCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma)) {
        parseWhitespaceAndSkipComments();
      }
      let initial = true;
      while (i < text.length && text.charCodeAt(i) !== _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBrace) {
        let processedComma;
        if (!initial) {
          processedComma = parseCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma);
          if (!processedComma) {
            // repair missing comma
            output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ',');
          }
          parseWhitespaceAndSkipComments();
        } else {
          processedComma = true;
          initial = false;
        }
        skipEllipsis();
        const processedKey = parseString() || parseUnquotedString();
        if (!processedKey) {
          if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBrace || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeOpeningBrace || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBracket || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeOpeningBracket || text[i] === undefined) {
            // repair trailing comma
            output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.stripLastOccurrence)(output, ',');
          } else {
            throwObjectKeyExpected();
          }
          break;
        }
        parseWhitespaceAndSkipComments();
        const processedColon = parseCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeColon);
        const truncatedText = i >= text.length;
        if (!processedColon) {
          if ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isStartOfValue)(text[i]) || truncatedText) {
            // repair missing colon
            output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ':');
          } else {
            throwColonExpected();
          }
        }
        const processedValue = parseValue();
        if (!processedValue) {
          if (processedColon || truncatedText) {
            // repair missing object value
            output += 'null';
          } else {
            throwColonExpected();
          }
        }
      }
      if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBrace) {
        output += '}';
        i++;
      } else {
        // repair missing end bracket
        output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, '}');
      }
      return true;
    }
    return false;
  }

  /**
   * Parse an array like '["item1", "item2", ...]'
   */
  function parseArray() {
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeOpeningBracket) {
      output += '[';
      i++;
      parseWhitespaceAndSkipComments();

      // repair: skip leading comma like in [,1,2,3]
      if (skipCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma)) {
        parseWhitespaceAndSkipComments();
      }
      let initial = true;
      while (i < text.length && text.charCodeAt(i) !== _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBracket) {
        if (!initial) {
          const processedComma = parseCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma);
          if (!processedComma) {
            // repair missing comma
            output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ',');
          }
        } else {
          initial = false;
        }
        skipEllipsis();
        const processedValue = parseValue();
        if (!processedValue) {
          // repair trailing comma
          output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.stripLastOccurrence)(output, ',');
          break;
        }
      }
      if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeClosingBracket) {
        output += ']';
        i++;
      } else {
        // repair missing closing array bracket
        output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ']');
      }
      return true;
    }
    return false;
  }

  /**
   * Parse and repair Newline Delimited JSON (NDJSON):
   * multiple JSON objects separated by a newline character
   */
  function parseNewlineDelimitedJSON() {
    // repair NDJSON
    let initial = true;
    let processedValue = true;
    while (processedValue) {
      if (!initial) {
        // parse optional comma, insert when missing
        const processedComma = parseCharacter(_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeComma);
        if (!processedComma) {
          // repair: add missing comma
          output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, ',');
        }
      } else {
        initial = false;
      }
      processedValue = parseValue();
    }
    if (!processedValue) {
      // repair: remove trailing comma
      output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.stripLastOccurrence)(output, ',');
    }

    // repair: wrap the output inside array brackets
    output = "[\n".concat(output, "\n]");
  }

  /**
   * Parse a string enclosed by double quotes "...". Can contain escaped quotes
   * Repair strings enclosed in single quotes or special quotes
   * Repair an escaped string
   *
   * The function can run in two stages:
   * - First, it assumes the string has a valid end quote
   * - If it turns out that the string does not have a valid end quote followed
   *   by a delimiter (which should be the case), the function runs again in a
   *   more conservative way, stopping the string at the first next delimiter
   *   and fixing the string by inserting a quote there.
   */
  function parseString() {
    let stopAtDelimiter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    let skipEscapeChars = text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeBackslash;
    if (skipEscapeChars) {
      // repair: remove the first escape character
      i++;
      skipEscapeChars = true;
    }
    if ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isQuote)(text.charCodeAt(i))) {
      // double quotes are correct JSON,
      // single quotes come from JavaScript for example, we assume it will have a correct single end quote too
      // otherwise, we will match any double-quote-like start with a double-quote-like end,
      // or any single-quote-like start with a single-quote-like end
      const isEndQuote = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDoubleQuote)(text.charCodeAt(i)) ? _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDoubleQuote : (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isSingleQuote)(text.charCodeAt(i)) ? _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isSingleQuote : (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isSingleQuoteLike)(text.charCodeAt(i)) ? _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isSingleQuoteLike : _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDoubleQuoteLike;
      const iBefore = i;
      const oBefore = output.length;
      let str = '"';
      i++;
      while (true) {
        if (i >= text.length) {
          // end of text, we are missing an end quote

          const iPrev = prevNonWhitespaceIndex(i - 1);
          if (!stopAtDelimiter && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiter)(text.charAt(iPrev))) {
            // if the text ends with a delimiter, like ["hello],
            // so the missing end quote should be inserted before this delimiter
            // retry parsing the string, stopping at the first next delimiter
            i = iBefore;
            output = output.substring(0, oBefore);
            return parseString(true);
          }

          // repair missing quote
          str = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(str, '"');
          output += str;
          return true;
        } else if (isEndQuote(text.charCodeAt(i))) {
          // end quote
          // let us check what is before and after the quote to verify whether this is a legit end quote
          const iQuote = i;
          const oQuote = str.length;
          str += '"';
          i++;
          output += str;
          parseWhitespaceAndSkipComments();
          if (stopAtDelimiter || i >= text.length || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiter)(text.charAt(i)) || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isQuote)(text.charCodeAt(i)) || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
            // The quote is followed by the end of the text, a delimiter, or a next value
            // so the quote is indeed the end of the string
            parseConcatenatedString();
            return true;
          }
          if ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiter)(text.charAt(prevNonWhitespaceIndex(iQuote - 1)))) {
            // This is not the right end quote: it is preceded by a delimiter,
            // and NOT followed by a delimiter. So, there is an end quote missing
            // parse the string again and then stop at the first next delimiter
            i = iBefore;
            output = output.substring(0, oBefore);
            return parseString(true);
          }

          // revert to right after the quote but before any whitespace, and continue parsing the string
          output = output.substring(0, oBefore);
          i = iQuote + 1;

          // repair unescaped quote
          str = str.substring(0, oQuote) + '\\' + str.substring(oQuote);
        } else if (stopAtDelimiter && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiter)(text[i])) {
          // we're in the mode to stop the string at the first delimiter
          // because there is an end quote missing

          // repair missing quote
          str = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(str, '"');
          output += str;
          parseConcatenatedString();
          return true;
        } else if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeBackslash) {
          // handle escaped content like \n or \u2605
          const char = text.charAt(i + 1);
          const escapeChar = escapeCharacters[char];
          if (escapeChar !== undefined) {
            str += text.slice(i, i + 2);
            i += 2;
          } else if (char === 'u') {
            let j = 2;
            while (j < 6 && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isHex)(text.charCodeAt(i + j))) {
              j++;
            }
            if (j === 6) {
              str += text.slice(i, i + 6);
              i += 6;
            } else if (i + j >= text.length) {
              // repair invalid or truncated unicode char at the end of the text
              // by removing the unicode char and ending the string here
              i = text.length;
            } else {
              throwInvalidUnicodeCharacter();
            }
          } else {
            // repair invalid escape character: remove it
            str += char;
            i += 2;
          }
        } else {
          // handle regular characters
          const char = text.charAt(i);
          const code = text.charCodeAt(i);
          if (code === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDoubleQuote && text.charCodeAt(i - 1) !== _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeBackslash) {
            // repair unescaped double quote
            str += '\\' + char;
            i++;
          } else if ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isControlCharacter)(code)) {
            // unescaped control character
            str += controlCharacters[char];
            i++;
          } else {
            if (!(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isValidStringCharacter)(code)) {
              throwInvalidCharacter(char);
            }
            str += char;
            i++;
          }
        }
        if (skipEscapeChars) {
          // repair: skipped escape character (nothing to do)
          skipEscapeCharacter();
        }
      }
    }
    return false;
  }

  /**
   * Repair concatenated strings like "hello" + "world", change this into "helloworld"
   */
  function parseConcatenatedString() {
    let processed = false;
    parseWhitespaceAndSkipComments();
    while (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codePlus) {
      processed = true;
      i++;
      parseWhitespaceAndSkipComments();

      // repair: remove the end quote of the first string
      output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.stripLastOccurrence)(output, '"', true);
      const start = output.length;
      const parsedStr = parseString();
      if (parsedStr) {
        // repair: remove the start quote of the second string
        output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.removeAtIndex)(output, start, 1);
      } else {
        // repair: remove the + because it is not followed by a string
        output = (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.insertBeforeLastWhitespace)(output, '"');
      }
    }
    return processed;
  }

  /**
   * Parse a number like 2.4 or 2.4e6
   */
  function parseNumber() {
    const start = i;
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeMinus) {
      i++;
      if (atEndOfNumber()) {
        repairNumberEndingWithNumericSymbol(start);
        return true;
      }
      if (!(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
        i = start;
        return false;
      }
    }

    // Note that in JSON leading zeros like "00789" are not allowed.
    // We will allow all leading zeros here though and at the end of parseNumber
    // check against trailing zeros and repair that if needed.
    // Leading zeros can have meaning, so we should not clear them.
    while ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
      i++;
    }
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDot) {
      i++;
      if (atEndOfNumber()) {
        repairNumberEndingWithNumericSymbol(start);
        return true;
      }
      if (!(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
        i = start;
        return false;
      }
      while ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
        i++;
      }
    }
    if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeLowercaseE || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeUppercaseE) {
      i++;
      if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeMinus || text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codePlus) {
        i++;
      }
      if (atEndOfNumber()) {
        repairNumberEndingWithNumericSymbol(start);
        return true;
      }
      if (!(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
        i = start;
        return false;
      }
      while ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDigit)(text.charCodeAt(i))) {
        i++;
      }
    }

    // if we're not at the end of the number by this point, allow this to be parsed as another type
    if (!atEndOfNumber()) {
      i = start;
      return false;
    }
    if (i > start) {
      // repair a number with leading zeros like "00789"
      const num = text.slice(start, i);
      const hasInvalidLeadingZero = /^0\d/.test(num);
      output += hasInvalidLeadingZero ? "\"".concat(num, "\"") : num;
      return true;
    }
    return false;
  }

  /**
   * Parse keywords true, false, null
   * Repair Python keywords True, False, None
   */
  function parseKeywords() {
    return parseKeyword('true', 'true') || parseKeyword('false', 'false') || parseKeyword('null', 'null') ||
    // repair Python keywords True, False, None
    parseKeyword('True', 'true') || parseKeyword('False', 'false') || parseKeyword('None', 'null');
  }
  function parseKeyword(name, value) {
    if (text.slice(i, i + name.length) === name) {
      output += value;
      i += name.length;
      return true;
    }
    return false;
  }

  /**
   * Repair an unquoted string by adding quotes around it
   * Repair a MongoDB function call like NumberLong("2")
   * Repair a JSONP function call like callback({...});
   */
  function parseUnquotedString() {
    // note that the symbol can end with whitespaces: we stop at the next delimiter
    // also, note that we allow strings to contain a slash / in order to support repairing regular expressions
    const start = i;
    while (i < text.length && !(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiterExceptSlash)(text[i]) && !(0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isQuote)(text.charCodeAt(i))) {
      i++;
    }
    if (i > start) {
      if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeOpenParenthesis && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isFunctionName)(text.slice(start, i).trim())) {
        // repair a MongoDB function call like NumberLong("2")
        // repair a JSONP function call like callback({...});
        i++;
        parseValue();
        if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeCloseParenthesis) {
          // repair: skip close bracket of function call
          i++;
          if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeSemicolon) {
            // repair: skip semicolon after JSONP call
            i++;
          }
        }
        return true;
      } else {
        // repair unquoted string
        // also, repair undefined into null

        // first, go back to prevent getting trailing whitespaces in the string
        while ((0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isWhitespace)(text.charCodeAt(i - 1)) && i > 0) {
          i--;
        }
        const symbol = text.slice(start, i);
        output += symbol === 'undefined' ? 'null' : JSON.stringify(symbol);
        if (text.charCodeAt(i) === _utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.codeDoubleQuote) {
          // we had a missing start quote, but now we encountered the end quote, so we can skip that one
          i++;
        }
        return true;
      }
    }
  }
  function prevNonWhitespaceIndex(start) {
    let prev = start;
    while (prev > 0 && (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isWhitespace)(text.charCodeAt(prev))) {
      prev--;
    }
    return prev;
  }
  function atEndOfNumber() {
    return i >= text.length || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isDelimiter)(text[i]) || (0,_utils_stringUtils_js__WEBPACK_IMPORTED_MODULE_0__.isWhitespace)(text.charCodeAt(i));
  }
  function repairNumberEndingWithNumericSymbol(start) {
    // repair numbers cut off at the end
    // this will only be called when we end after a '.', '-', or 'e' and does not
    // change the number more than it needs to make it valid JSON
    output += text.slice(start, i) + '0';
  }
  function throwInvalidCharacter(char) {
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError('Invalid character ' + JSON.stringify(char), i);
  }
  function throwUnexpectedCharacter() {
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError('Unexpected character ' + JSON.stringify(text[i]), i);
  }
  function throwUnexpectedEnd() {
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError('Unexpected end of json string', text.length);
  }
  function throwObjectKeyExpected() {
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError('Object key expected', i);
  }
  function throwColonExpected() {
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError('Colon expected', i);
  }
  function throwInvalidUnicodeCharacter() {
    const chars = text.slice(i, i + 6);
    throw new _utils_JSONRepairError_js__WEBPACK_IMPORTED_MODULE_1__.JSONRepairError("Invalid unicode character \"".concat(chars, "\""), i);
  }
}
function atEndOfBlockComment(text, i) {
  return text[i] === '*' && text[i + 1] === '/';
}
//# sourceMappingURL=jsonrepair.js.map

/***/ }),

/***/ 70:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JSONRepairError: () => (/* binding */ JSONRepairError)
/* harmony export */ });
class JSONRepairError extends Error {
  constructor(message, position) {
    super(message + ' at position ' + position);
    this.position = position;
  }
}
//# sourceMappingURL=JSONRepairError.js.map

/***/ }),

/***/ 71:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   codeAsterisk: () => (/* binding */ codeAsterisk),
/* harmony export */   codeBackslash: () => (/* binding */ codeBackslash),
/* harmony export */   codeBackspace: () => (/* binding */ codeBackspace),
/* harmony export */   codeCloseParenthesis: () => (/* binding */ codeCloseParenthesis),
/* harmony export */   codeClosingBrace: () => (/* binding */ codeClosingBrace),
/* harmony export */   codeClosingBracket: () => (/* binding */ codeClosingBracket),
/* harmony export */   codeColon: () => (/* binding */ codeColon),
/* harmony export */   codeComma: () => (/* binding */ codeComma),
/* harmony export */   codeDot: () => (/* binding */ codeDot),
/* harmony export */   codeDoubleQuote: () => (/* binding */ codeDoubleQuote),
/* harmony export */   codeFormFeed: () => (/* binding */ codeFormFeed),
/* harmony export */   codeLowercaseA: () => (/* binding */ codeLowercaseA),
/* harmony export */   codeLowercaseE: () => (/* binding */ codeLowercaseE),
/* harmony export */   codeLowercaseF: () => (/* binding */ codeLowercaseF),
/* harmony export */   codeMinus: () => (/* binding */ codeMinus),
/* harmony export */   codeNewline: () => (/* binding */ codeNewline),
/* harmony export */   codeNine: () => (/* binding */ codeNine),
/* harmony export */   codeOpenParenthesis: () => (/* binding */ codeOpenParenthesis),
/* harmony export */   codeOpeningBrace: () => (/* binding */ codeOpeningBrace),
/* harmony export */   codeOpeningBracket: () => (/* binding */ codeOpeningBracket),
/* harmony export */   codePlus: () => (/* binding */ codePlus),
/* harmony export */   codeQuote: () => (/* binding */ codeQuote),
/* harmony export */   codeReturn: () => (/* binding */ codeReturn),
/* harmony export */   codeSemicolon: () => (/* binding */ codeSemicolon),
/* harmony export */   codeSlash: () => (/* binding */ codeSlash),
/* harmony export */   codeSpace: () => (/* binding */ codeSpace),
/* harmony export */   codeTab: () => (/* binding */ codeTab),
/* harmony export */   codeUppercaseA: () => (/* binding */ codeUppercaseA),
/* harmony export */   codeUppercaseE: () => (/* binding */ codeUppercaseE),
/* harmony export */   codeUppercaseF: () => (/* binding */ codeUppercaseF),
/* harmony export */   codeZero: () => (/* binding */ codeZero),
/* harmony export */   endsWithCommaOrNewline: () => (/* binding */ endsWithCommaOrNewline),
/* harmony export */   insertBeforeLastWhitespace: () => (/* binding */ insertBeforeLastWhitespace),
/* harmony export */   isControlCharacter: () => (/* binding */ isControlCharacter),
/* harmony export */   isDelimiter: () => (/* binding */ isDelimiter),
/* harmony export */   isDelimiterExceptSlash: () => (/* binding */ isDelimiterExceptSlash),
/* harmony export */   isDigit: () => (/* binding */ isDigit),
/* harmony export */   isDoubleQuote: () => (/* binding */ isDoubleQuote),
/* harmony export */   isDoubleQuoteLike: () => (/* binding */ isDoubleQuoteLike),
/* harmony export */   isFunctionName: () => (/* binding */ isFunctionName),
/* harmony export */   isHex: () => (/* binding */ isHex),
/* harmony export */   isQuote: () => (/* binding */ isQuote),
/* harmony export */   isSingleQuote: () => (/* binding */ isSingleQuote),
/* harmony export */   isSingleQuoteLike: () => (/* binding */ isSingleQuoteLike),
/* harmony export */   isSpecialWhitespace: () => (/* binding */ isSpecialWhitespace),
/* harmony export */   isStartOfValue: () => (/* binding */ isStartOfValue),
/* harmony export */   isValidStringCharacter: () => (/* binding */ isValidStringCharacter),
/* harmony export */   isWhitespace: () => (/* binding */ isWhitespace),
/* harmony export */   removeAtIndex: () => (/* binding */ removeAtIndex),
/* harmony export */   stripLastOccurrence: () => (/* binding */ stripLastOccurrence)
/* harmony export */ });
const codeBackslash = 0x5c; // "\"
const codeSlash = 0x2f; // "/"
const codeAsterisk = 0x2a; // "*"
const codeOpeningBrace = 0x7b; // "{"
const codeClosingBrace = 0x7d; // "}"
const codeOpeningBracket = 0x5b; // "["
const codeClosingBracket = 0x5d; // "]"
const codeOpenParenthesis = 0x28; // "("
const codeCloseParenthesis = 0x29; // ")"
const codeSpace = 0x20; // " "
const codeNewline = 0xa; // "\n"
const codeTab = 0x9; // "\t"
const codeReturn = 0xd; // "\r"
const codeBackspace = 0x08; // "\b"
const codeFormFeed = 0x0c; // "\f"
const codeDoubleQuote = 0x0022; // "
const codePlus = 0x2b; // "+"
const codeMinus = 0x2d; // "-"
const codeQuote = 0x27; // "'"
const codeZero = 0x30; // "0"
const codeNine = 0x39; // "9"
const codeComma = 0x2c; // ","
const codeDot = 0x2e; // "." (dot, period)
const codeColon = 0x3a; // ":"
const codeSemicolon = 0x3b; // ";"
const codeUppercaseA = 0x41; // "A"
const codeLowercaseA = 0x61; // "a"
const codeUppercaseE = 0x45; // "E"
const codeLowercaseE = 0x65; // "e"
const codeUppercaseF = 0x46; // "F"
const codeLowercaseF = 0x66; // "f"
const codeNonBreakingSpace = 0xa0;
const codeEnQuad = 0x2000;
const codeHairSpace = 0x200a;
const codeNarrowNoBreakSpace = 0x202f;
const codeMediumMathematicalSpace = 0x205f;
const codeIdeographicSpace = 0x3000;
const codeDoubleQuoteLeft = 0x201c; // “
const codeDoubleQuoteRight = 0x201d; // ”
const codeQuoteLeft = 0x2018; // ‘
const codeQuoteRight = 0x2019; // ’
const codeGraveAccent = 0x0060; // `
const codeAcuteAccent = 0x00b4; // ´

function isHex(code) {
  return code >= codeZero && code <= codeNine || code >= codeUppercaseA && code <= codeUppercaseF || code >= codeLowercaseA && code <= codeLowercaseF;
}
function isDigit(code) {
  return code >= codeZero && code <= codeNine;
}
function isValidStringCharacter(code) {
  return code >= 0x20 && code <= 0x10ffff;
}
function isDelimiter(char) {
  return regexDelimiter.test(char);
}
const regexDelimiter = /^[,:[\]/{}()\n+]$/;
function isDelimiterExceptSlash(char) {
  return isDelimiter(char) && char !== '/';
}
function isStartOfValue(char) {
  return regexStartOfValue.test(char) || char && isQuote(char.charCodeAt(0));
}

// alpha, number, minus, or opening bracket or brace
const regexStartOfValue = /^[[{\w-]$/;
function isControlCharacter(code) {
  return code === codeNewline || code === codeReturn || code === codeTab || code === codeBackspace || code === codeFormFeed;
}

/**
 * Check if the given character is a whitespace character like space, tab, or
 * newline
 */
function isWhitespace(code) {
  return code === codeSpace || code === codeNewline || code === codeTab || code === codeReturn;
}

/**
 * Check if the given character is a special whitespace character, some
 * unicode variant
 */
function isSpecialWhitespace(code) {
  return code === codeNonBreakingSpace || code >= codeEnQuad && code <= codeHairSpace || code === codeNarrowNoBreakSpace || code === codeMediumMathematicalSpace || code === codeIdeographicSpace;
}

/**
 * Test whether the given character is a quote or double quote character.
 * Also tests for special variants of quotes.
 */
function isQuote(code) {
  // the first check double quotes, since that occurs most often
  return isDoubleQuoteLike(code) || isSingleQuoteLike(code);
}

/**
 * Test whether the given character is a double quote character.
 * Also tests for special variants of double quotes.
 */
function isDoubleQuoteLike(code) {
  // the first check double quotes, since that occurs most often
  return code === codeDoubleQuote || code === codeDoubleQuoteLeft || code === codeDoubleQuoteRight;
}

/**
 * Test whether the given character is a double quote character.
 * Does NOT test for special variants of double quotes.
 */
function isDoubleQuote(code) {
  return code === codeDoubleQuote;
}

/**
 * Test whether the given character is a single quote character.
 * Also tests for special variants of single quotes.
 */
function isSingleQuoteLike(code) {
  return code === codeQuote || code === codeQuoteLeft || code === codeQuoteRight || code === codeGraveAccent || code === codeAcuteAccent;
}

/**
 * Test whether the given character is a single quote character.
 * Does NOT test for special variants of single quotes.
 */
function isSingleQuote(code) {
  return code === codeQuote;
}

/**
 * Strip last occurrence of textToStrip from text
 */
function stripLastOccurrence(text, textToStrip) {
  let stripRemainingText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const index = text.lastIndexOf(textToStrip);
  return index !== -1 ? text.substring(0, index) + (stripRemainingText ? '' : text.substring(index + 1)) : text;
}
function insertBeforeLastWhitespace(text, textToInsert) {
  let index = text.length;
  if (!isWhitespace(text.charCodeAt(index - 1))) {
    // no trailing whitespaces
    return text + textToInsert;
  }
  while (isWhitespace(text.charCodeAt(index - 1))) {
    index--;
  }
  return text.substring(0, index) + textToInsert + text.substring(index);
}
function removeAtIndex(text, start, count) {
  return text.substring(0, start) + text.substring(start + count);
}

/**
 * Test whether a string ends with a newline or comma character and optional whitespace
 */
function endsWithCommaOrNewline(text) {
  return /[,\n][ \t\r]*$/.test(text);
}
function isFunctionName(text) {
  return /^\w+$/.test(text);
}
//# sourceMappingURL=stringUtils.js.map

/***/ })

};
;
//# sourceMappingURL=1.extension.js.map