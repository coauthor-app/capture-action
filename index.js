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

    // const fileName = './test/sample.txt';
    // // eslint-disable-next-line no-undef
    // const blob = new Blob([await readFile(fileName)]);
    // // eslint-disable-next-line no-undef
    // const form = new FormData();
    // Object.entries(json.fields).forEach(([field, value]) => {
    //     form.set(field, value);
    // });
    // form.set('key', `${json.fields.key}/sample.txt`);
    // form.set('file', blob, 'sample.txt');
    //
    // const resp = await fetch(json.url, {
    //     method: 'POST',
    //     body: form,
    // });


} catch (error) {
    core.setFailed(error.message);
}
