const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Create a file to stream archive data to
const output = fs.createWriteStream("./backend-deploy.zip");
const archive = archiver("zip", {
  zlib: { level: 9 }, // Sets the compression level
});

// Listen for all archive data to be written
output.on("close", function () {
  console.log(archive.pointer() + " total bytes");
  console.log(
    "Archive has been finalized and the output file descriptor has been closed.",
  );
});

// This event is fired when the data source is drained
output.on("end", function () {
  console.log("Data has been drained");
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on("warning", function (err) {
  if (err.code === "ENOENT") {
    console.warn(err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on("error", function (err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from backend directory, putting its contents at the root of archive
archive.glob("**/*", {
  cwd: path.resolve("./backend"),
  ignore: [
    "**/node_modules/**",
    "**/.git/**",
    "**/npm-debug.log",
    "**/.DS_Store",
  ],
});

// Finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();
