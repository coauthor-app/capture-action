const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob')
const {readFile} = require("node:fs/promises");

try {
    const path = core.getInput('path');
    const switem = core.getInput('switem');
    const evidence = core.getInput('evidence');
    const type = core.getInput('type');
    const format = core.getInput('format');
    const hostname = core.getInput('hostname');

    const body = JSON.stringify({ switem, evidence, type, format });
    const response = await fetch(`https://${hostname}/upload/job`, {
        method: 'POST',
        body,
    });
    const json = await response.json();
    console.log(json);

    const globber = glob.create(core.getInput('files'), { followSymbolicLinks: true });
    for await (const file of globber.globGenerator()) {
        console.log(file)
    }

} catch (error) {
    core.setFailed(error.message);
}
