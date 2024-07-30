import './style.css';

import { WebContainer } from '@webcontainer/api';

import intializeTerminal from './terminal';
import initializeEditor from './editor';

import files from './files';

let webcontainerInstance;

const commandOutput = document.querySelector('.command-output-container');

(async () => {

  webcontainerInstance = await WebContainer.boot();
  webcontainerInstance.mount(files);

  webcontainerInstance.on('server-ready', (port, url) => {
    document.querySelector('.dev-server-container').src = url;
  });

  initializeCommandExecutor();

  const terminal = intializeTerminal();
  startShell(terminal);

  editorContentChangeHandler(initializeEditor());

})();

function initializeCommandExecutor() {
  const commandInput = document.querySelector('.command-input');
  const commandButton = document.querySelector('.execute-command');

  commandButton.addEventListener('click', async () => {
    const [command, ...args] = commandInput.value.split(' ');
    await runCommand(command, args);
  });

}

async function runCommand(command, ...args) {
  const commandProcess = await webcontainerInstance.spawn(command, args);

  if (await commandProcess.exit) {
    throw new Error('WebContainer error');
  }

  commandProcess.output.pipeTo(
    new WritableStream(
      {
        write(chunk) {
          commandOutput.innerHTML = `${chunk}<br />`;
        }
      }
    )
  )
}

async function startShell(terminal) {
  const shellProcess = await webcontainerInstance.spawn('jsh');

  shellProcess.output.pipeTo(
    new WritableStream(
      {
        write(chunk) {
          terminal.write(chunk);
        }
      }
    )
  );

  const input = shellProcess.input.getWriter();
  terminal.onData((chunk) => {
    input.write(chunk);
  });
}

async function editorContentChangeHandler(editor) {
  editor.onDidChangeModelContent(async (e) => {
    const value = editor.getValue();
    const filePath = document.querySelector('.path-input').value;

    await webcontainerInstance.fs.writeFile(`/${filePath}`, value);
  });

  document.querySelector('.load-file').addEventListener('click', async () => {
    const filePath = document.querySelector('.path-input').value;
    const fileContent = await webcontainerInstance.fs.readFile(filePath, 'utf-8');
    editor.setValue(fileContent);
  });
}
