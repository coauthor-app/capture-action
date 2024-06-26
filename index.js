const core = require('@actions/core');
const glob = require('@actions/glob');
const {readFile} = require('node:fs/promises');
const pathUtil = require('path');

async function completeJob(jobId, token, hostname, success) {
  await fetch(`https://${hostname}/upload/job/${jobId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({status: success ? 'completed' : 'expired'})
  });
}

async function run() {
  const path = core.getInput('path', {required: true});
  const switem = core.getInput('switem', {required: false}) || 'system';
  const evidence = core.getInput('evidence', {required: true});
  const type = core.getInput('type', {required: true});
  const format = core.getInput('format', {required: true});
  const hostname = core.getInput('hostname', {required: false}) || 'archive.coauthor.app';
  const token = await core.getIDToken();

  if (!token) {
    core.setFailed('No OIDC token found.');
    return;
  }

  const body = JSON.stringify({switem, evidence, type, format});
  const response = await fetch(`https://${hostname}/upload/job`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    core.setFailed(`Failed to prepare upload: ${response.status} - ${text}`);
    return;
  }

  const json = await response.json();

  const globber = await glob.create(path, {followSymbolicLinks: true, matchDirectories: false});

  const cwd = `${process.cwd()}${pathUtil.sep}`;

  const successfulUploads = [];
  const failedUploads = [];

  for await (const file of globber.globGenerator()) {
    const filePath = file.replace(cwd, '');
    const fileName = pathUtil.basename(filePath);
    console.log(`Uploading ${filePath}`);

    const blob = new Blob([await readFile(filePath)]);

    const form = new FormData();
    Object.entries(json.fields).forEach(([field, value]) => {
      form.set(field, value);
    });
    form.set('key', `${json.fields.key}/${filePath}`);
    form.set('file', blob, fileName);

    const resp = await fetch(json.url, {
      method: 'POST',
      body: form
    });

    if (resp.ok) {
      successfulUploads.push(filePath);
    } else {
      failedUploads.push(filePath);
    }
  }

  console.log(`Uploads: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
  if (failedUploads.length > 0) {
    await completeJob(json.jobId, token, hostname, false);
    core.setFailed(`Failed to upload: ${failedUploads.join(', ')}`);
  } else {
    await completeJob(json.jobId, token, hostname, true);
  }
}

run().catch(error => {
  core.setFailed(error.message);
});
