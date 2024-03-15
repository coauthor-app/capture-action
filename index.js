const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob')
const {readFile} = require("node:fs/promises");
const pathUtil = require('path');


async function run() {
    const path = core.getInput('path');
    const switem = core.getInput('switem');
    const evidence = core.getInput('evidence');
    const type = core.getInput('type');
    const format = core.getInput('format');
    const hostname = core.getInput('hostname');
    const token = await core.getIDToken();

    if (!token) {
        core.setFailed('No OIDC token found.');
        return;
    }

    console.log(`test ${token}`);

    const body = JSON.stringify({ switem, evidence, type, format });
    const response = await fetch(`https://${hostname}/upload/job`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        core.setFailed(`Failed to prepare upload: ${response.status} - ${text}`);
        return;
    }
    console.log(`test ${response.status}`);
    const json = await response.json();


    const globber = await glob.create(path, { followSymbolicLinks: true, matchDirectories: false });
    console.log(`test ${path}`);

    const cwd = `${process.cwd()}${pathUtil.sep}`;

    const successfulUploads = [];
    const failedUploads = [];

    for await (const file of globber.globGenerator()) {
        const filePath = file.replace(cwd, '');
        const fileName = pathUtil.basename(filePath);
        console.log(`${file} - ${filePath} - ${fileName}`);

        // eslint-disable-next-line no-undef
        const blob = new Blob([await readFile(filePath)]);
        // eslint-disable-next-line no-undef
        const form = new FormData();
        Object.entries(json.fields).forEach(([field, value]) => {
            form.set(field, value);
        });
        form.set('key', `${json.fields.key}/${filePath}`);
        form.set('file', blob, fileName);

        const resp = await fetch(json.url, {
            method: 'POST',
            body: form,
        });

        if (resp.ok) {
            successfulUploads.push(filePath);
        } else {
            failedUploads.push(filePath);
        }
    }

    console.log(`Uploads: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
    if (failedUploads.length > 0) {
        core.setFailed(`Failed to upload: ${failedUploads.join(', ')}`);
    }
}

run().catch(error => {
    core.setFailed(error.message);
})