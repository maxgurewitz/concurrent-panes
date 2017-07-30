import {spawn, ChildProcess} from 'child_process';
import * as WebSocket from 'ws';
import * as through from 'through';

const process = global.process;

function runTask(taskname: string) {
  return spawn('sh', ['-c', taskname], {
    env: process.env,
    cwd: process.cwd()
  });
}

interface Callback {
  (err: CodedError, res?: any): void
}

class CodedError extends Error {
  code: number;
  task: string;

  constructor(task: string, code: number, message=`${task} exited with code ${code}`) {
    super(message);
    this.code = code;
  }
}

class ProcessHandler {

  process: ChildProcess;

  ws: WebSocket;

  task: string;

  constructor(task: string, process: ChildProcess) {
    this.process = process;
    this.task = task;
    this.ws = null;
  }

  pipeProcessToWs(websocket: WebSocket) {
    this.ws = websocket;
    this.process.stderr.pipe(this.buildWsThrough(this.task, 'stderr'));
    this.process.stdout.pipe(this.buildWsThrough(this.task, 'stdout'));
  }

  send(message: object) {
    this.ws.send(JSON.stringify(message), this.onSend);
  }

  buildWsThrough(task: string, outputType: string): through.ThroughStream {
    return through(
      buffer =>
        this.send({
          type: 'output',
          task,
          outputType,
          message: String(buffer)
        }),
      () =>
        this.send({
          type: 'end',
          task,
          outputType
        })
    );
  }

  onSend(err: Error) {
    if (err) {
      console.error('Failed to send message: ', err);
    }
  }
}

function handleSocket(ws: WebSocket, existingProcesses?: ChildProcess[]): ChildProcess[] {
  return [];
}

export default function parallel(tasks: string[], done: Callback) {
  let alreadyDone = false;
  let counter = tasks.length;

  function doneErr(e: CodedError): void {
    if (alreadyDone) { return; }
    alreadyDone = true;
    done(e);
  }

  function doneOk() {
    if (alreadyDone || --counter > 0) { return; }
    alreadyDone = true;
    done(null);
  }

  const wss = new WebSocket.Server({ port: 3001 });

  let handlers:  ProcessHandler[];

  wss.on('connection', ws => {
    ws.send(JSON.stringify({ type: 'init', tasks: tasks }));

    if (handlers) {
      handlers.forEach(handler => {
        handler.ws = ws;
      });
    } else {
      handlers = tasks.map(task => {
        const process = runTask(task);

        process.on('error', err => doneErr(new CodedError(task, 1, err.message)));

        process.on('close', code => {
          if (code !== 0) {
            const err = new CodedError(task, code);
            doneErr(err);
          } else {
            doneOk();
          }
        });

        const handler = new ProcessHandler(task, process);

        handler.pipeProcessToWs(ws);

        return handler;
      });
    }
  });
}
