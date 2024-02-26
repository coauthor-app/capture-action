const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob')
const {readFile} = require("node:fs/promises");


async function run() {
    const path = core.getInput('path');
    const switem = core.getInput('switem');
    const evidence = core.getInput('evidence');
    const type = core.getInput('type');
    const format = core.getInput('format');
    const hostname = core.getInput('hostname');
    const token = await core.getIDToken();

    console.log(`test ${token}`);

    const body = JSON.stringify({ switem, evidence, type, format });
    const response = await fetch(`https://${hostname}/upload/job`, {
        method: 'POST',
        body,
    });
    const json = await response.json();


    const globber = await glob.create(path, { followSymbolicLinks: true });
    console.log(`test ${path}`);
    console.log(`${JSON.stringify(globber)}`);
    for await (const file of globber.globGenerator()) {
        console.log(file)
    }
}

run().catch(error => {
  core.setFailed(error.message);
})