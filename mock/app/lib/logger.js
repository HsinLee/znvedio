import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
import log4js from 'koa-log4'

const logger = log4js.getLogger('znvedio');
logger.level = 'debug';

export default logger