import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';

export default function intializeTerminal() {

  const terminalContainer = document.querySelector('.terminal-container');

  const terminal = new Terminal({
    convertEol: true
  });

  terminal.open(terminalContainer);

  return terminal;

}
