import Parse from 'parse/node.js';

export const initializeParse = () => {
  if (!process.env.PARSE_APP_ID || !process.env.PARSE_JS_KEY || !process.env.PARSE_SERVER_URL) {
    throw new Error('Missing required Parse configuration. Please check your .env file.');
  }

  Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JS_KEY
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL;
};

export const testParseConnection = async () => {
  try {
    const TestObject = Parse.Object.extend('TestConnection');
    const query = new Parse.Query(TestObject);
    query.limit(1);
    
    await query.find();
    return true;
  } catch (error) {
    console.error('Parse Server Connection Error:', error.message);
    return false;
  }
}; 