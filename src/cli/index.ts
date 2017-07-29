import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import * as through from 'through';

const process = global.process;

function runTask(taskname: string) {
  return childProcess.spawn('sh', [taskname], {
    env: process.env,
    cwd: process.cwd()
  });
}

interface Callback {
  (err: CodedError, res?: any): void
}

class CodedError extends Error {
  code: number;

  constructor(code: number, message=`Exited with code ${code}`) {
    super(message);
    this.code = code;
  }
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

  wss.on('connection', ws => {
    ws.on('message', message => {
    });

    tasks.forEach(task => {
      const proc = runTask(task);

      proc.on('error', err => doneErr(new CodedError(1, err.message)));

      proc.on('close', code => {
        if (code !== 0) {
          const err = new CodedError(code);
          doneErr(err);
        } else {
          doneOk();
        }
      })

      function sendMessage(task: string, outputType: string): through.ThroughStream {
        return through(
          buffer => ws.send(JSON.stringify({ task, outputType, message: String(buffer) })),
            () => ws.send(JSON.stringify({}))
        );
      }

      proc.stderr.pipe(sendMessage(task, 'stderr'));
      proc.stdout.pipe(sendMessage(task, 'stdout'));
    });
  });
}
