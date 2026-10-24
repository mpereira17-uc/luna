// PixiJS 8 + pixi-filters as one script for the game, with the no-eval module so it runs under strict page policies
import * as PIXI from 'pixi.js';
import 'pixi.js/unsafe-eval';
import * as filters from 'pixi-filters';
window.PIXI = Object.assign({}, PIXI, { filters });
