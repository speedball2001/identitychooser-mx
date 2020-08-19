import { Options } from '../modules/options.js';

var options = new Options();
document.addEventListener("DOMContentLoaded", (e) => options.run(e), {once: true});
