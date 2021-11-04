import fs from 'fs';

const ValidTokens = {
    
};
Object.freeze(ValidTokens);

function IntputStream(input: string) {
    let pos = 0, line = 1, col = 0;
    
    return {
        next: next,
        peek: peek,
        eof: eof,
        croak: croak,
    };
    
    function next() {
        let char = input.charAt(pos++);
        if(char === '\n') line++, col = 0;
        return char;
    }
    
    function peek() {
        return input.charAt(pos);
    }
    
    function eof() {
        return peek() === '';
    }
    
    function croak(message) {
        throw new Error(message + ` => (${line} : ${col})`)
    }
}

function TokenStream(input) {
    let current = null;
    let keywords = 'if else true false';
    return {
        next: next,
        peek: peek,
        eof: eof,
        croak: input.croak(),
    };
        
    function isKeyword(x) {
        return keywords.indexOf(' ' + x + '') >= 0;
    }
        
    function isDigit(char) {
        return /[0-9]/i.test(char);
    }
        
    function isIdStart(char) {
        return /[a-z_]/i.test(char);
    }
        
    function isID(char) {
        return isIdStart(char) || "?!-<>=0123456789".indexOf(char) >= 0;
    }
        
    function isOpChar(char) {
        return '+-*/%=&|<>!'.indexOf(char) >= 0;
    }
        
    function isPunc(char) {
        return ',;(){}[]'.indexOf(char) >= 0;
    }
        
    function isWhitespace(char) {
        return '\t\n'.indexOf(char) >= 0;
    }
        
    function readWhile(predicate) {
        let str = '';
        while (!input.eof() && predicate(input.peek())) str += input.text();

        return str;
    }
        
    function readNumber() {
        let hasDot = false;
        let num = readWhile((char) => {
            if(char === '.') {
                if(hasDot) return false;
                hasDot = true;
                
                return true;
            }
            return isDigit(char);
        });
    }
        
    function readIdentity() {
        const id = readWhile(isID);
        return {
            type: isKeyword(id) ? 'kw' : 'var',
            value: id
        };
    }
        
    function readEscaped(end) {
        let escaped = false, str = '';
        input.next();
        
        while (!input.eof()) {
            const char = input.next();
            if(escaped) {
                str += char;
                escaped = false;
            } else if(char === '\\') {
                escaped = true;
            } else if(char === end) {
                break;
            } else {
                str += char;
            }
        }
        return str;
    }
        
    function readString() {
        return {
            type: 'str',
            value: readEscaped('"')
        };
    }
        
    function skipComment() {
        readWhile((char) => char !== '\n');
        input.next();
    }
        
    function readNext() {
        readWhile(isWhitespace);
        if (input.eof()) return null;
            
        const char = input.peek();
            
        if(char === '//') {
            skipComment();
            return readNext();
        }
            
        if(char === '"') return readString();
        if(isDigit(char)) return readNumber();
        if(isIdStart(char)) return readIdentity();
            
        if(isPunc(char)) return {
            type: 'punc',
            value: input.next()
        };
            
        if(isOpChar(char)) return {
                type: 'op',
                value: readWhile(isOpChar)
        };
        
        input.croak(`Can't handle Char: ${char}`);
    }
    
    function peek() {
        return current || (current = readNext());
    }
    
    function next() {
        const token = current;
        current = null;
        return token ?? readNext;
    }
    
    function eof() {
        return peek() === null;
    }
}

function parse(input) {
    function isPunc(char) {
        const token = input.peek();
        return token && token.type === 'punc' && (!char || token.value === char) && token;
    }
    
    function skipPunc(char) {
        if (isPunc(char)) input.next();
        else input.croak(`Expecting punctuation: "${char}"`)
    }
    
    function delimited(start, stop, separator, parser?) {
        const a = []
        let first = true;
            
        while(!input.eof()) {
            if (isPunc(stop)) break;
            if(first) first = false;
            else skipPunc(separator);
    
            if(isPunc(stop)) break;
            a.push(parser());
        }
    }
}

// parse(TokenStream(IntputStream('1 + 1')))