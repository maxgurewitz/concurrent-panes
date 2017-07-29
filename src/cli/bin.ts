import concurrentPanes from '.';
const args = process.argv.slice(2, process.argv.length);

concurrentPanes(args, err => {
  if (err) {
    console.log(err.message);
    process.exit(err.code);
  } else {
    process.exit(0);
  }
});
