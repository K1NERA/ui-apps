// Copyright 2017-2023 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');

const HEADER = `// Copyright 2017-2023 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Automatically generated, do not edit

/* eslint-disable simple-import-sort/imports */`;
const PATH = 'packages/react-components/src/IdentityIcon/RoboHash';

function getCounter (index) {
  return `000${index}`.slice(-3);
}

function getFiles (dir) {
  const all = fs
    .readdirSync(dir)
    .filter((entry) => !entry.endsWith('.ts'))
    .map((entry) => {
      if (entry.includes('#')) {
        const newName = entry.replace(/#/g, '-');

        fs.renameSync(path.join(dir, entry), path.join(dir, newName));

        return newName;
      }

      return entry;
    })
    .sort((a, b) =>
      (a.includes('-') && b.includes('-'))
        ? a.split('-')[1].localeCompare(b.split('-')[1])
        : 0
    );

  for (let f of all) {
    if (f.endsWith('.png')) {
      const full = path.join(dir, f);

      fs.writeFileSync(full.replace('.png', '.ts'), `${HEADER}\n\nexport default 'data:image/png;base64,${fs.readFileSync(full).toString('base64')}';\n`);
    }
  }

  return all;
}

function extractBg () {
  const root = path.join(__dirname, '..', PATH, 'backgrounds');
  const files = [];

  getFiles(root).forEach((sub) => {
    getFiles(path.join(root, sub)).forEach((entry) => files.push(`./${sub}/${entry}`));
  });

  fs.writeFileSync(path.join(root, 'index.ts'), `${HEADER}\n\n${files.map((file, index) => `import b${getCounter(index)} from '${file.replace('.png', '')}';`).join('\n')}\n\nexport default [${files.map((_, index) => `b${getCounter(index)}`).join(', ')}];\n`);
}

function extractSets () {
  const root = path.join(__dirname, '..', PATH, 'sets');
  const sets = getFiles(root).map((sub) =>
    getFiles(path.join(root, sub)).map((dir) =>
      getFiles(path.join(root, sub, dir)).map((entry) => `./${sub}/${dir}/${entry}`)
    )
  );

  const imports = [];
  let list = '[';

  sets.forEach((areas, sindex) => {
    list = `${list}${sindex ? ',' : ''}\n  [`;

    areas.forEach((files, aindex) => {
      const indexes = files.map((file, findex) => {
        const index = `s${getCounter(sindex)}${getCounter(aindex)}${getCounter(findex)}`;

        imports.push(`import ${index} from '${file.replace('.png', '')}';`);

        return index;
      });

      list = `${list}${aindex ? ',' : ''}\n    [${indexes.join(', ')}]`;
    });

    list = `${list}\n  ]`;
  });

  list = `${list}\n];`;

  fs.writeFileSync(path.join(root, 'index.ts'), `${HEADER}\n\n${imports.join('\n')}\n\nexport default ${list}\n`);
}

extractBg();
extractSets();
