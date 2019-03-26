// Creates a VS workspace from a root project, including the dependencies
// and launches vscode.
//
// Usage: create-vs-code-workspace @namespace/project1
// Usage: create-vs-code-workspace {@namespace/project1,@namespace/project2}

import { sync } from "cross-spawn";
import * as fs from "fs";
import * as path from "path";

const extensions = require("../.vscode/extensions.json");
const launch = require("../.vscode/launch.json");
const settings = require("../.vscode/settings.json");

// Fix the tsserver references.
settings["typescript.tsdk"] = path.join(
  process.cwd(),
  "node_modules",
  "typescript",
  "lib"
);

const dependencies = JSON.parse(
  sync("lerna", [
    "ls",
    "--scope",
    process.argv[2],
    "--include-filtered-dependencies",
    "--json"
  ])
    .stdout.toString()
    .trim()
);

const sortedDependencies = dependencies.sort((a, b) => {
  return a.name.localeCompare(b.name);
});

const workspace = {
  folders: sortedDependencies.map(d => {
    return { path: d.location };
  }),
  settings,
  extensions,
  launch
};

const fileFormatFriendlyName = process.argv[2]
  .replace(/@namespace\//g, "")
  .replace(/{/g, "")
  .replace(/}/g, "")
  .replace(/,/g, "&");

const outFileName = fileFormatFriendlyName + ".generated.code-workspace";
fs.writeFileSync(outFileName, JSON.stringify(workspace));

console.log("Successfully created " + outFileName);

sync("code", [outFileName]);
