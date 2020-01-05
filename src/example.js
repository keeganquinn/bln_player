import { MusicControl } from './index';

require('bootstrap/dist/css/bootstrap.css');
require('bootstrap/dist/js/bootstrap.js');

const musicControl = new MusicControl();
musicControl.start();
musicControl.load();
