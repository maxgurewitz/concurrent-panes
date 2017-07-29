import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import * as through from 'through';

const process = global.process;

function runTask(taskname: string) {
  return childProcess.spawn('sh', ['-c', taskname], {
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
    ws.send(JSON.stringify({ type: 'init', tasks: tasks }));

    tasks.forEach(task => {
      const proc = runTask(task);

      proc.on('error', err => doneErr(new CodedError(task, 1, err.message)));

      proc.on('close', code => {
        if (code !== 0) {
          const err = new CodedError(task, code);
          doneErr(err);
        } else {
          doneOk();
        }
      })

      const onSendErr = (err: Error) => {
        if (err) {
          console.error('failed to send message', err);
        }
      };

      function sendMessage(task: string, outputType: string): through.ThroughStream {
        return through(
          buffer => ws.send(JSON.stringify({ type: 'output', task, outputType, message: String(buffer) }), onSendErr),
            () => ws.send(JSON.stringify({ type: 'end', outputType }), onSendErr)
        );
      }

      proc.stderr.pipe(sendMessage(task, 'stderr'));
      proc.stdout.pipe(sendMessage(task, 'stdout'));
    });
  });
}
